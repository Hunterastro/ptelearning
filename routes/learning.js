const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const Wordlist = require('../models/Wordlist');
const Word = require('../models/Word');
const LearningProgress = require('../models/LearningProgress');
const User = require('../models/User');

const router = express.Router();

// 开始学习单词表
router.post('/start/:wordlistId', authenticateToken, [
  body('isFirstTime')
    .optional()
    .isBoolean()
    .withMessage('首次学习标识必须是布尔值'),
  body('studyMode')
    .optional()
    .isIn(['normal', 'review', 'test'])
    .withMessage('学习模式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { wordlistId } = req.params;
    const { isFirstTime = true, studyMode = 'normal' } = req.body;

    // 验证单词表是否存在
    const wordlist = await Wordlist.findOne({
      _id: wordlistId,
      isActive: true,
      isPublic: true
    });

    if (!wordlist) {
      return res.status(404).json({
        message: '单词表不存在或无权访问'
      });
    }

    // 初始化或获取学习进度
    let progress = await LearningProgress.findOne({
      userId: req.user._id,
      wordlistId
    });

    if (!progress) {
      progress = await LearningProgress.initializeProgress(req.user._id, wordlistId);
    }

    // 更新学习模式
    progress.studyMode = studyMode;
    progress.isFirstTime = isFirstTime;
    await progress.save();

    res.json({
      message: '学习开始',
      progress: {
        id: progress._id,
        wordlistId,
        studyMode,
        isFirstTime,
        completionRate: progress.completionRate,
        averageScore: progress.averageScore,
        totalStudyTime: progress.totalStudyTime
      },
      wordlist: {
        id: wordlist._id,
        name: wordlist.name,
        category: wordlist.category,
        difficulty: wordlist.difficulty,
        wordCount: wordlist.wordCount
      }
    });

  } catch (error) {
    console.error('开始学习错误:', error);
    res.status(500).json({
      message: '开始学习失败'
    });
  }
});

// 获取下一个要学习的单词
router.get('/next/:wordlistId', authenticateToken, [
  query('mode')
    .optional()
    .isIn(['new', 'review', 'random'])
    .withMessage('学习模式无效'),
  query('count')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('单词数量必须在1-20之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '查询参数验证失败',
        errors: errors.array()
      });
    }

    const { wordlistId } = req.params;
    const mode = req.query.mode || 'new';
    const count = parseInt(req.query.count) || 1;

    // 获取学习进度
    const progress = await LearningProgress.findOne({
      userId: req.user._id,
      wordlistId
    });

    if (!progress) {
      return res.status(404).json({
        message: '未找到学习进度，请先开始学习'
      });
    }

    let words = [];

    switch (mode) {
      case 'review':
        // 获取需要复习的单词
        const reviewWords = progress.getWordsForReview(count);
        if (reviewWords.length > 0) {
          const wordIds = reviewWords.map(w => w.wordId);
          words = await Word.find({
            _id: { $in: wordIds },
            isActive: true
          });
        }
        break;

      case 'random':
        // 获取随机单词
        words = await Word.getRandomWords(wordlistId, count);
        break;

      case 'new':
      default:
        // 获取新单词
        words = await LearningProgress.getNewWords(req.user._id, wordlistId, count);
        break;
    }

    if (words.length === 0) {
      return res.json({
        message: mode === 'review' ? '暂无需要复习的单词' : '没有更多新单词了',
        words: [],
        hasMore: false,
        progress: {
          completionRate: progress.completionRate,
          averageScore: progress.averageScore,
          totalWords: progress.words.length
        }
      });
    }

    // 随机打乱单词顺序
    const shuffledWords = words.sort(() => Math.random() - 0.5);

    res.json({
      message: '获取学习单词成功',
      words: shuffledWords,
      hasMore: true,
      mode,
      progress: {
        completionRate: progress.completionRate,
        averageScore: progress.averageScore,
        totalWords: progress.words.length
      }
    });

  } catch (error) {
    console.error('获取学习单词错误:', error);
    res.status(500).json({
      message: '获取学习单词失败'
    });
  }
});

// 提交单词学习结果
router.post('/submit/:wordlistId/:wordId', authenticateToken, [
  body('choice')
    .isIn(['know', 'unknown', 'vague'])
    .withMessage('选择必须是 know, unknown 或 vague'),
  body('reviewTime')
    .optional()
    .isNumeric()
    .withMessage('复习时间必须是数字'),
  body('studyTime')
    .optional()
    .isNumeric()
    .withMessage('学习时间必须是数字')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { wordlistId, wordId } = req.params;
    const { choice, reviewTime = 0, studyTime = 0 } = req.body;

    // 验证单词是否存在
    const word = await Word.findOne({
      _id: wordId,
      wordlistId,
      isActive: true
    });

    if (!word) {
      return res.status(404).json({
        message: '单词不存在'
      });
    }

    // 获取学习进度
    let progress = await LearningProgress.findOne({
      userId: req.user._id,
      wordlistId
    });

    if (!progress) {
      progress = await LearningProgress.initializeProgress(req.user._id, wordlistId);
    }

    // 更新单词学习进度
    await progress.updateWordProgress(wordId, choice, reviewTime);

    // 更新单词统计信息
    await word.updateStatistics(choice === 'know');

    // 更新用户学习统计
    if (studyTime > 0) {
      await req.user.updateLearningStats(1, Math.round(studyTime / 60));
    }

    res.json({
      message: '学习结果提交成功',
      progress: {
        completionRate: progress.completionRate,
        averageScore: progress.averageScore,
        totalWords: progress.words.length,
        isCompleted: progress.isCompleted
      },
      wordProgress: {
        choice,
        familiarity: progress.words.find(w => w.wordId.toString() === wordId.toString())?.familiarity || 0,
        status: progress.words.find(w => w.wordId.toString() === wordId.toString())?.status || 'new'
      }
    });

  } catch (error) {
    console.error('提交学习结果错误:', error);
    res.status(500).json({
      message: '提交学习结果失败'
    });
  }
});

// 获取学习进度
router.get('/progress/:wordlistId', authenticateToken, async (req, res) => {
  try {
    const { wordlistId } = req.params;

    const progress = await LearningProgress.findOne({
      userId: req.user._id,
      wordlistId
    }).populate('wordlistId', 'name category difficulty wordCount');

    if (!progress) {
      return res.status(404).json({
        message: '未找到学习进度'
      });
    }

    // 计算各种统计数据
    const stats = {
      totalWords: progress.words.length,
      newWords: progress.words.filter(w => w.status === 'new').length,
      learningWords: progress.words.filter(w => w.status === 'learning').length,
      familiarWords: progress.words.filter(w => w.status === 'familiar').length,
      masteredWords: progress.words.filter(w => w.status === 'mastered').length,
      completionRate: progress.completionRate,
      averageScore: progress.averageScore,
      totalStudyTime: progress.totalStudyTime,
      isCompleted: progress.isCompleted,
      startedAt: progress.startedAt,
      lastStudied: progress.lastStudied
    };

    // 获取需要复习的单词数量
    const reviewWords = progress.getWordsForReview(100);
    stats.reviewWords = reviewWords.length;

    res.json({
      progress: stats,
      wordlist: progress.wordlistId
    });

  } catch (error) {
    console.error('获取学习进度错误:', error);
    res.status(500).json({
      message: '获取学习进度失败'
    });
  }
});

// 获取用户所有学习进度
router.get('/progress', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('status').optional().isIn(['active', 'completed', 'all']).withMessage('状态过滤无效')
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
    const status = req.query.status || 'all';

    // 构建查询条件
    const queryConditions = {
      userId: req.user._id
    };

    if (status === 'completed') {
      queryConditions.isCompleted = true;
    } else if (status === 'active') {
      queryConditions.isCompleted = false;
    }

    // 查询学习进度
    const [progressList, total] = await Promise.all([
      LearningProgress.find(queryConditions)
        .populate('wordlistId', 'name category difficulty wordCount')
        .sort({ lastStudied: -1 })
        .skip(skip)
        .limit(limit),
      LearningProgress.countDocuments(queryConditions)
    ]);

    // 格式化返回数据，匹配前端期望的结构
    const formattedProgressList = progressList.map(progress => {
      // 计算各种状态的单词数量
      const newWords = progress.words.filter(w => w.status === 'new').length;
      const learningWords = progress.words.filter(w => w.status === 'learning').length;
      const familiarWords = progress.words.filter(w => w.status === 'familiar').length;
      const masteredWords = progress.words.filter(w => w.status === 'mastered').length;
      const reviewWords = progress.getWordsForReview(100).length;

      return {
        _id: progress._id,
        wordlistId: progress.wordlistId,
        progress: {
          totalWords: progress.words.length,
          newWords,
          learningWords,
          familiarWords,
          masteredWords,
          reviewWords,
          completionRate: progress.completionRate,
          averageScore: progress.averageScore,
          totalStudyTime: progress.totalStudyTime,
          isCompleted: progress.isCompleted,
          startedAt: progress.startedAt,
          lastStudied: progress.lastStudied
        },
        lastStudied: progress.lastStudied
      };
    });

    res.json({
      progressList: formattedProgressList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取学习进度列表错误:', error);
    res.status(500).json({
      message: '获取学习进度列表失败'
    });
  }
});

// 获取今日复习单词
router.get('/review/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 设置到今天结束

    // 获取用户所有学习进度
    const allProgress = await LearningProgress.find({
      userId: req.user._id
    }).populate('wordlistId', 'name category');

    let totalReviewWords = 0;
    const reviewByWordlist = [];

    for (const progress of allProgress) {
      const reviewWords = progress.getWordsForReview(100);
      if (reviewWords.length > 0) {
        totalReviewWords += reviewWords.length;
        reviewByWordlist.push({
          wordlist: progress.wordlistId,
          reviewCount: reviewWords.length,
          urgentCount: reviewWords.filter(w => 
            new Date(w.nextReview) < new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length
        });
      }
    }

    res.json({
      totalReviewWords,
      reviewByWordlist,
      message: totalReviewWords > 0 ? `今日需要复习 ${totalReviewWords} 个单词` : '今日无需复习'
    });

  } catch (error) {
    console.error('获取今日复习错误:', error);
    res.status(500).json({
      message: '获取今日复习失败'
    });
  }
});

// 获取学习统计
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // 获取用户所有学习进度
    const allProgress = await LearningProgress.find({
      userId: user._id
    });

    // 计算总体统计
    const stats = {
      totalWordlists: allProgress.length,
      completedWordlists: allProgress.filter(p => p.isCompleted).length,
      totalWordsLearned: allProgress.reduce((sum, p) => sum + p.words.length, 0),
      masteredWords: allProgress.reduce((sum, p) => 
        sum + p.words.filter(w => w.status === 'mastered').length, 0
      ),
      totalStudyTime: user.learningStats.totalStudyTime,
      currentStreak: user.learningStats.currentStreak,
      averageScore: allProgress.length > 0 
        ? Math.round(allProgress.reduce((sum, p) => sum + p.averageScore, 0) / allProgress.length)
        : 0,
      dailyGoal: user.preferences.dailyGoal,
      lastStudyDate: user.learningStats.lastStudyDate
    };

    // 获取本周学习情况
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentProgress = allProgress.filter(p => 
      p.lastStudied && p.lastStudied > weekAgo
    );

    stats.weeklyActivity = recentProgress.length;

    res.json(stats);

  } catch (error) {
    console.error('获取学习统计错误:', error);
    res.status(500).json({
      message: '获取学习统计失败'
    });
  }
});

// 获取单词详情（包含用户学习状态）
router.get('/word/:wordId', authenticateToken, async (req, res) => {
  try {
    const { wordId } = req.params;
    
    const word = await Word.findOne({
      _id: wordId,
      isActive: true
    });

    if (!word) {
      return res.status(404).json({
        message: '单词不存在'
      });
    }

    // 获取用户对该单词的学习状态
    const learningStatus = await word.getLearningStatus(req.user._id);

    res.json({
      word,
      learningStatus
    });

  } catch (error) {
    console.error('获取单词详情错误:', error);
    res.status(500).json({
      message: '获取单词详情失败'
    });
  }
});

// 重置学习进度
router.post('/reset/:wordlistId', authenticateToken, async (req, res) => {
  try {
    const { wordlistId } = req.params;

    const progress = await LearningProgress.findOne({
      userId: req.user._id,
      wordlistId
    });

    if (!progress) {
      return res.status(404).json({
        message: '未找到学习进度'
      });
    }

    // 重置进度
    progress.words = [];
    progress.isFirstTime = true;
    progress.completionRate = 0;
    progress.averageScore = 0;
    progress.isCompleted = false;
    progress.startedAt = new Date();

    await progress.save();

    res.json({
      message: '学习进度重置成功'
    });

  } catch (error) {
    console.error('重置学习进度错误:', error);
    res.status(500).json({
      message: '重置学习进度失败'
    });
  }
});

module.exports = router; 