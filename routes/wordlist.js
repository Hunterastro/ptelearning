const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadSingle, handleUploadError, validateFile } = require('../middleware/upload');
const { parseFile, validateAndCleanWordData, detectHeader, generatePreview } = require('../utils/fileParser');
const Wordlist = require('../models/Wordlist');
const Word = require('../models/Word');
const LearningProgress = require('../models/LearningProgress');

const router = express.Router();

// 获取所有公开的单词表（分页）
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('category').optional().isString().withMessage('分类必须是字符串'),
  query('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('难度级别无效'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '查询参数验证失败',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const queryConditions = {
      isActive: true,
      isPublic: true
    };

    if (req.query.category) {
      queryConditions.category = req.query.category;
    }

    if (req.query.difficulty) {
      queryConditions.difficulty = req.query.difficulty;
    }

    if (req.query.search) {
      queryConditions.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // 查询数据
    const [wordlists, total] = await Promise.all([
      Wordlist.find(queryConditions)
        .populate('createdBy', 'username profile.nickname')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Wordlist.countDocuments(queryConditions)
    ]);

    res.json({
      wordlists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取单词表列表错误:', error);
    res.status(500).json({
      message: '获取单词表列表失败'
    });
  }
});

// 获取单词表详情
router.get('/:id', async (req, res) => {
  try {
    const wordlist = await Wordlist.findOne({
      _id: req.params.id,
      isActive: true
    }).populate('createdBy', 'username profile.nickname');

    if (!wordlist) {
      return res.status(404).json({
        message: '单词表不存在'
      });
    }

    // 如果不是公开的单词表，需要验证权限
    if (!wordlist.isPublic && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        message: '无权访问此单词表'
      });
    }

    res.json(wordlist);

  } catch (error) {
    console.error('获取单词表详情错误:', error);
    res.status(500).json({
      message: '获取单词表详情失败'
    });
  }
});

// 管理员预览上传文件（原有的两步流程）
router.post('/upload-preview', authenticateToken, requireAdmin, (req, res) => {
  uploadSingle(req, res, (err) => {
    handleUploadError(err, req, res, async () => {
      validateFile(req, res, async () => {
        try {
          // 解析上传的文件
          const parseResult = parseFile(req.file.path);
          
          if (!parseResult.success) {
            return res.status(400).json({
              message: parseResult.message,
              parseError: true
            });
          }

          // 检测是否有标题行
          const hasHeader = detectHeader(parseResult.data);
          
          // 生成预览数据
          const preview = generatePreview(parseResult.data, 5);

          // 返回预览数据供用户确认
          res.json({
            message: '文件解析成功',
            preview,
            hasHeader,
            totalRows: parseResult.rowCount,
            fileName: req.file.originalname,
            tempFile: req.file.filename
          });

        } catch (error) {
          console.error('文件解析错误:', error);
          res.status(500).json({
            message: '文件解析失败'
          });
        }
      });
    });
  });
});

// 管理员一步上传并创建词汇表（简化流程）
router.post('/upload', authenticateToken, requireAdmin, (req, res) => {
  uploadSingle(req, res, (err) => {
    handleUploadError(err, req, res, async () => {
      validateFile(req, res, async () => {
        try {
          const fileName = req.file.originalname;
          const baseName = fileName.replace(/\.[^/.]+$/, ""); // 去掉扩展名
          
          // 解析上传的文件
          const parseResult = parseFile(req.file.path);
          
          if (!parseResult.success) {
            return res.status(400).json({
              success: false,
              message: parseResult.message,
              parseError: true
            });
          }

          // 检测是否有标题行
          const hasHeader = detectHeader(parseResult.data);
          
          // 验证和清理数据
          const validationResult = validateAndCleanWordData(parseResult.data, hasHeader);
          
          if (!validationResult.success) {
            return res.status(400).json({
              success: false,
              message: '数据验证失败',
              errors: validationResult.errors
            });
          }

          // 生成唯一的词汇表名称
          let wordlistName = baseName;
          let counter = 1;
          while (await Wordlist.findOne({ name: wordlistName })) {
            wordlistName = `${baseName} (${counter})`;
            counter++;
          }

          // 创建单词表
          const wordlist = new Wordlist({
            name: wordlistName,
            description: `从文件 ${fileName} 自动导入`,
            category: 'Other', // 默认分类
            difficulty: 'Intermediate', // 默认难度
            createdBy: req.user._id,
            fileName: fileName,
            filePath: req.file.path,
            fileSize: req.file.size,
            wordCount: validationResult.validWords.length,
            isPublic: true,
            tags: ['自动导入'],
            uploadDate: new Date()
          });

          await wordlist.save();

          // 批量插入单词
          await Word.bulkImport(wordlist._id, validationResult.validWords);

          // 更新单词表的单词数量
          await wordlist.updateWordCount();

          res.status(201).json({
            success: true,
            message: `词汇表"${wordlistName}"创建成功`,
            wordlist,
            wordsCount: validationResult.validWords.length,
            preview: generatePreview(parseResult.data.slice(hasHeader ? 1 : 0), 3)
          });

        } catch (error) {
          console.error('文件上传创建错误:', error);
          res.status(500).json({
            success: false,
            message: '文件上传失败'
          });
        }
      });
    });
  });
});

// 确认创建单词表
router.post('/create', authenticateToken, requireAdmin, [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('单词表名称长度必须在1-100个字符之间'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述最多500个字符'),
  body('category')
    .isIn(['PTE', 'IELTS', 'TOEFL', 'Business', 'Academic', 'General', 'Other'])
    .withMessage('分类无效'),
  body('difficulty')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('难度级别无效'),
  body('tempFile')
    .notEmpty()
    .withMessage('临时文件名不能为空'),
  body('hasHeader')
    .isBoolean()
    .withMessage('标题行标识必须是布尔值'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('公开状态必须是布尔值'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { name, description, category, difficulty, tempFile, hasHeader, isPublic = true, tags = [] } = req.body;

    // 检查单词表名称是否已存在
    const existingWordlist = await Wordlist.findOne({ name });
    if (existingWordlist) {
      return res.status(400).json({
        message: '单词表名称已存在'
      });
    }

    // 解析文件
    const filePath = `uploads/${tempFile}`;
    const parseResult = parseFile(filePath);
    
    if (!parseResult.success) {
      return res.status(400).json({
        message: parseResult.message
      });
    }

    // 验证和清理数据
    const validationResult = validateAndCleanWordData(parseResult.data, hasHeader);
    
    if (!validationResult.success) {
      return res.status(400).json({
        message: '数据验证失败',
        errors: validationResult.errors
      });
    }

    // 创建单词表
    const wordlist = new Wordlist({
      name,
      description,
      category,
      difficulty,
      createdBy: req.user._id,
      fileName: req.body.fileName || tempFile,
      filePath,
      fileSize: require('fs').statSync(filePath).size,
      wordCount: validationResult.validWords.length,
      isPublic,
      tags: tags.filter(tag => tag && tag.trim()),
      uploadDate: new Date()
    });

    await wordlist.save();

    // 批量插入单词
    await Word.bulkImport(wordlist._id, validationResult.validWords);

    // 更新单词表的单词数量
    await wordlist.updateWordCount();

    res.status(201).json({
      message: '单词表创建成功',
      wordlist,
      wordsCount: validationResult.validWords.length
    });

  } catch (error) {
    console.error('创建单词表错误:', error);
    res.status(500).json({
      message: '创建单词表失败'
    });
  }
});

// 获取单词表中的单词列表
router.get('/:id/words', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '查询参数验证失败',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 验证单词表是否存在
    const wordlist = await Wordlist.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!wordlist) {
      return res.status(404).json({
        message: '单词表不存在'
      });
    }

    // 构建查询条件
    const queryConditions = {
      wordlistId: req.params.id,
      isActive: true
    };

    if (req.query.search) {
      queryConditions.$or = [
        { phrase: { $regex: req.query.search, $options: 'i' } },
        { meaning: { $regex: req.query.search, $options: 'i' } },
        { example: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // 查询单词
    const [words, total] = await Promise.all([
      Word.find(queryConditions)
        .sort({ order: 1 })
        .skip(skip)
        .limit(limit),
      Word.countDocuments(queryConditions)
    ]);

    res.json({
      words,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      wordlist: {
        id: wordlist._id,
        name: wordlist.name,
        category: wordlist.category,
        difficulty: wordlist.difficulty
      }
    });

  } catch (error) {
    console.error('获取单词列表错误:', error);
    res.status(500).json({
      message: '获取单词列表失败'
    });
  }
});

// 管理员删除单词表
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const wordlist = await Wordlist.findById(req.params.id);
    
    if (!wordlist) {
      return res.status(404).json({
        message: '单词表不存在'
      });
    }

    // 软删除单词表
    wordlist.isActive = false;
    await wordlist.save();

    // 软删除相关单词
    await Word.updateMany(
      { wordlistId: req.params.id },
      { isActive: false }
    );

    res.json({
      message: '单词表删除成功'
    });

  } catch (error) {
    console.error('删除单词表错误:', error);
    res.status(500).json({
      message: '删除单词表失败'
    });
  }
});

// 管理员更新单词表信息
router.put('/:id', authenticateToken, requireAdmin, [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('单词表名称长度必须在1-100个字符之间'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述最多500个字符'),
  body('category')
    .optional()
    .isIn(['PTE', 'IELTS', 'TOEFL', 'Business', 'Academic', 'General', 'Other'])
    .withMessage('分类无效'),
  body('difficulty')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('难度级别无效'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('公开状态必须是布尔值'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const wordlist = await Wordlist.findById(req.params.id);
    
    if (!wordlist) {
      return res.status(404).json({
        message: '单词表不存在'
      });
    }

    // 更新字段
    const { name, description, category, difficulty, isPublic, tags } = req.body;
    
    if (name !== undefined) wordlist.name = name;
    if (description !== undefined) wordlist.description = description;
    if (category !== undefined) wordlist.category = category;
    if (difficulty !== undefined) wordlist.difficulty = difficulty;
    if (isPublic !== undefined) wordlist.isPublic = isPublic;
    if (tags !== undefined) wordlist.tags = tags.filter(tag => tag && tag.trim());
    
    wordlist.lastUpdated = new Date();
    await wordlist.save();

    res.json({
      message: '单词表更新成功',
      wordlist
    });

  } catch (error) {
    console.error('更新单词表错误:', error);
    res.status(500).json({
      message: '更新单词表失败'
    });
  }
});

// 获取单词表统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const wordlist = await Wordlist.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!wordlist) {
      return res.status(404).json({
        message: '单词表不存在'
      });
    }

    // 更新统计信息
    await wordlist.updateStatistics();

    const stats = {
      wordCount: wordlist.wordCount,
      totalUsers: wordlist.statistics.totalUsers,
      completionRate: wordlist.statistics.completionRate,
      averageScore: wordlist.statistics.averageScore,
      createdAt: wordlist.createdAt,
      lastUpdated: wordlist.lastUpdated
    };

    res.json(stats);

  } catch (error) {
    console.error('获取单词表统计错误:', error);
    res.status(500).json({
      message: '获取统计信息失败'
    });
  }
});

module.exports = router; 