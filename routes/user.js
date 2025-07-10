const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const LearningProgress = require('../models/LearningProgress');

const router = express.Router();

// 更新用户偏好设置
router.put('/preferences', authenticateToken, [
  body('dailyGoal')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每日目标必须在1-100之间'),
  body('reviewInterval')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('复习间隔必须在1-30天之间'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('难度设置无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { dailyGoal, reviewInterval, difficulty } = req.body;
    const user = req.user;

    // 更新偏好设置
    if (dailyGoal !== undefined) {
      user.preferences.dailyGoal = dailyGoal;
    }
    if (reviewInterval !== undefined) {
      user.preferences.reviewInterval = reviewInterval;
    }
    if (difficulty !== undefined) {
      user.preferences.difficulty = difficulty;
    }

    await user.save();

    res.json({
      message: '偏好设置更新成功',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('更新偏好设置错误:', error);
    res.status(500).json({
      message: '更新偏好设置失败'
    });
  }
});

// 获取用户偏好设置
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    res.json({
      preferences: req.user.preferences
    });
  } catch (error) {
    console.error('获取偏好设置错误:', error);
    res.status(500).json({
      message: '获取偏好设置失败'
    });
  }
});

// 获取用户学习报告
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // 获取用户所有学习进度
    const allProgress = await LearningProgress.find({
      userId: user._id
    }).populate('wordlistId', 'name category difficulty');

    // 计算学习报告
    const report = {
      overview: {
        totalWordlists: allProgress.length,
        completedWordlists: allProgress.filter(p => p.isCompleted).length,
        totalWordsLearned: user.learningStats.totalWordsLearned,
        totalStudyTime: user.learningStats.totalStudyTime,
        currentStreak: user.learningStats.currentStreak,
        averageScore: allProgress.length > 0
          ? Math.round(allProgress.reduce((sum, p) => sum + p.averageScore, 0) / allProgress.length)
          : 0
      },
      categoryBreakdown: {},
      difficultyBreakdown: {},
      recentActivity: [],
      achievements: []
    };

    // 按分类统计
    allProgress.forEach(progress => {
      const category = progress.wordlistId.category;
      if (!report.categoryBreakdown[category]) {
        report.categoryBreakdown[category] = {
          wordlists: 0,
          totalWords: 0,
          masteredWords: 0,
          averageScore: 0
        };
      }
      
      const categoryData = report.categoryBreakdown[category];
      categoryData.wordlists += 1;
      categoryData.totalWords += progress.words.length;
      categoryData.masteredWords += progress.words.filter(w => w.status === 'mastered').length;
      categoryData.averageScore = Math.round(
        (categoryData.averageScore * (categoryData.wordlists - 1) + progress.averageScore) / categoryData.wordlists
      );
    });

    // 按难度统计
    allProgress.forEach(progress => {
      const difficulty = progress.wordlistId.difficulty;
      if (!report.difficultyBreakdown[difficulty]) {
        report.difficultyBreakdown[difficulty] = {
          wordlists: 0,
          totalWords: 0,
          masteredWords: 0,
          averageScore: 0
        };
      }
      
      const difficultyData = report.difficultyBreakdown[difficulty];
      difficultyData.wordlists += 1;
      difficultyData.totalWords += progress.words.length;
      difficultyData.masteredWords += progress.words.filter(w => w.status === 'mastered').length;
      difficultyData.averageScore = Math.round(
        (difficultyData.averageScore * (difficultyData.wordlists - 1) + progress.averageScore) / difficultyData.wordlists
      );
    });

    // 近期活动
    const recentProgress = allProgress
      .filter(p => p.lastStudied)
      .sort((a, b) => new Date(b.lastStudied) - new Date(a.lastStudied))
      .slice(0, 10);

    report.recentActivity = recentProgress.map(progress => ({
      wordlist: progress.wordlistId.name,
      category: progress.wordlistId.category,
      lastStudied: progress.lastStudied,
      completionRate: progress.completionRate,
      averageScore: progress.averageScore
    }));

    // 成就系统
    const achievements = [];
    
    // 学习天数成就
    if (user.learningStats.consecutiveDays >= 7) {
      achievements.push({
        title: '学习达人',
        description: `连续学习${user.learningStats.consecutiveDays}天`,
        icon: '🔥',
        achieved: true
      });
    }
    
    // 掌握单词数成就
    const totalMastered = allProgress.reduce((sum, p) => 
      sum + p.words.filter(w => w.status === 'mastered').length, 0
    );
    if (totalMastered >= 100) {
      achievements.push({
        title: '单词大师',
        description: `掌握${totalMastered}个单词`,
        icon: '🎓',
        achieved: true
      });
    }
    
    // 完成单词表成就
    const completedCount = allProgress.filter(p => p.isCompleted).length;
    if (completedCount >= 5) {
      achievements.push({
        title: '学习专家',
        description: `完成${completedCount}个单词表`,
        icon: '🏆',
        achieved: true
      });
    }

    report.achievements = achievements;

    res.json(report);

  } catch (error) {
    console.error('获取学习报告错误:', error);
    res.status(500).json({
      message: '获取学习报告失败'
    });
  }
});

// 管理员：获取所有用户列表
router.get('/admin/users', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串'),
  query('role').optional().isIn(['user', 'admin', 'all']).withMessage('角色过滤无效'),
  query('status').optional().isIn(['active', 'inactive', 'all']).withMessage('状态过滤无效')
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
    const search = req.query.search;
    const role = req.query.role || 'all';
    const status = req.query.status || 'all';

    // 构建查询条件
    const queryConditions = {};

    if (role !== 'all') {
      queryConditions.role = role;
    }

    if (status === 'active') {
      queryConditions.isActive = true;
    } else if (status === 'inactive') {
      queryConditions.isActive = false;
    }

    if (search) {
      queryConditions.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.nickname': { $regex: search, $options: 'i' } }
      ];
    }

    // 查询用户
    const [users, total] = await Promise.all([
      User.find(queryConditions)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(queryConditions)
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      message: '获取用户列表失败'
    });
  }
});

// 管理员：获取系统统计
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 基础统计
    const [totalUsers, activeUsers, totalProgress] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      LearningProgress.countDocuments()
    ]);

    // 用户注册趋势（最近30天）
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const registrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // 学习活跃度（最近7天）
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const learningActivity = await LearningProgress.aggregate([
      {
        $match: {
          lastStudied: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$lastStudied'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // 最受欢迎的词单
    const popularWordlists = await LearningProgress.aggregate([
      {
        $group: {
          _id: '$wordlistId',
          studentsCount: { $sum: 1 },
          avgScore: { $avg: '$averageScore' }
        }
      },
      {
        $lookup: {
          from: 'wordlists',
          localField: '_id',
          foreignField: '_id',
          as: 'wordlist'
        }
      },
      {
        $unwind: '$wordlist'
      },
      {
        $sort: { studentsCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 1,
          name: '$wordlist.name',
          category: '$wordlist.category',
          studentsCount: 1,
          avgScore: { $round: ['$avgScore', 1] }
        }
      }
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalProgress,
        inactiveUsers: totalUsers - activeUsers
      },
      registrationTrend,
      learningActivity,
      popularWordlists
    });

  } catch (error) {
    console.error('获取系统统计错误:', error);
    res.status(500).json({
      message: '获取系统统计失败'
    });
  }
});

// 管理员：获取用户详情
router.get('/admin/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        message: '用户不存在'
      });
    }

    // 获取用户学习进度
    const progressList = await LearningProgress.find({
      userId
    }).populate('wordlistId', 'name category difficulty');

    // 计算统计信息
    const stats = {
      totalWordlists: progressList.length,
      completedWordlists: progressList.filter(p => p.isCompleted).length,
      totalWordsLearned: progressList.reduce((sum, p) => sum + p.words.length, 0),
      masteredWords: progressList.reduce((sum, p) => 
        sum + p.words.filter(w => w.status === 'mastered').length, 0
      ),
      averageScore: progressList.length > 0
        ? Math.round(progressList.reduce((sum, p) => sum + p.averageScore, 0) / progressList.length)
        : 0
    };

    res.json({
      user,
      learningStats: stats,
      recentProgress: progressList
        .sort((a, b) => new Date(b.lastStudied) - new Date(a.lastStudied))
        .slice(0, 5)
    });

  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      message: '获取用户详情失败'
    });
  }
});

// 管理员：更新用户状态
router.put('/admin/:userId/status', authenticateToken, requireAdmin, [
  body('isActive')
    .isBoolean()
    .withMessage('用户状态必须是布尔值'),
  body('reason')
    .optional()
    .isString()
    .withMessage('操作原因必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { isActive, reason } = req.body;

    // 防止管理员禁用自己
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        message: '不能修改自己的状态'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: '用户不存在'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `用户已${isActive ? '激活' : '禁用'}`,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({
      message: '更新用户状态失败'
    });
  }
});

// 管理员：更新用户角色
router.put('/admin/:userId/role', authenticateToken, requireAdmin, [
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('用户角色无效'),
  body('reason')
    .optional()
    .isString()
    .withMessage('操作原因必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { role, reason } = req.body;

    // 防止管理员降级自己
    if (userId === req.user._id.toString() && role === 'user') {
      return res.status(400).json({
        message: '不能降级自己的权限'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: '用户不存在'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `用户角色已更新为${role === 'admin' ? '管理员' : '普通用户'}`,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('更新用户角色错误:', error);
    res.status(500).json({
      message: '更新用户角色失败'
    });
  }
});

module.exports = router; 