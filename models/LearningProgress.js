const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  wordlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wordlist',
    required: true,
    index: true
  },
  words: [{
    wordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Word',
      required: true
    },
    // 学习状态：new, learning, familiar, mastered
    status: {
      type: String,
      enum: ['new', 'learning', 'familiar', 'mastered'],
      default: 'new'
    },
    // 熟悉度等级 (0-5)
    familiarity: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    // 用户选择：know, unknown, vague
    lastChoice: {
      type: String,
      enum: ['know', 'unknown', 'vague'],
      default: null
    },
    // 复习相关
    lastReviewed: {
      type: Date,
      default: null
    },
    nextReview: {
      type: Date,
      default: Date.now
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    // 学习统计
    correctCount: {
      type: Number,
      default: 0
    },
    incorrectCount: {
      type: Number,
      default: 0
    },
    totalAttempts: {
      type: Number,
      default: 0
    },
    // 艾宾浩斯间隔
    interval: {
      type: Number,
      default: 1 // 天数
    },
    easeFactor: {
      type: Number,
      default: 2.5 // 难度系数
    },
    // 学习历史
    history: [{
      date: {
        type: Date,
        default: Date.now
      },
      choice: {
        type: String,
        enum: ['know', 'unknown', 'vague']
      },
      reviewTime: {
        type: Number, // 复习时间（秒）
        default: 0
      }
    }]
  }],
  // 整体学习进度
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastStudied: {
    type: Date,
    default: Date.now
  },
  totalStudyTime: {
    type: Number,
    default: 0 // 分钟
  },
  completionRate: {
    type: Number,
    default: 0 // 百分比
  },
  averageScore: {
    type: Number,
    default: 0 // 平均分数
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  // 学习设置
  isFirstTime: {
    type: Boolean,
    default: true
  },
  studyMode: {
    type: String,
    enum: ['normal', 'review', 'test'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// 复合索引
learningProgressSchema.index({ userId: 1, wordlistId: 1 }, { unique: true });
learningProgressSchema.index({ userId: 1, 'words.nextReview': 1 });
learningProgressSchema.index({ 'words.status': 1 });

// 艾宾浩斯遗忘曲线算法
learningProgressSchema.methods.calculateNextReview = function(wordProgress, choice) {
  const now = new Date();
  let interval = wordProgress.interval;
  let easeFactor = wordProgress.easeFactor;
  
  // 根据用户选择调整参数
  switch (choice) {
    case 'know':
      // 认识：增加间隔
      if (wordProgress.reviewCount === 0) {
        interval = 1;
      } else if (wordProgress.reviewCount === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      easeFactor = Math.max(1.3, easeFactor + 0.1);
      break;
      
    case 'vague':
      // 模糊：稍微增加间隔
      if (wordProgress.reviewCount === 0) {
        interval = 1;
      } else {
        interval = Math.max(1, Math.round(interval * 0.8));
      }
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;
      
    case 'unknown':
      // 不认识：重置间隔
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;
  }
  
  // 计算下次复习时间
  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  
  return {
    interval,
    easeFactor,
    nextReview
  };
};

// 更新单词学习进度
learningProgressSchema.methods.updateWordProgress = function(wordId, choice, reviewTime = 0) {
  const wordProgress = this.words.find(w => w.wordId.toString() === wordId.toString());
  
  if (!wordProgress) {
    // 如果单词不存在，创建新的进度记录
    this.words.push({
      wordId,
      status: 'learning',
      familiarity: choice === 'know' ? 2 : choice === 'vague' ? 1 : 0,
      lastChoice: choice,
      lastReviewed: new Date(),
      reviewCount: 1,
      correctCount: choice === 'know' ? 1 : 0,
      incorrectCount: choice === 'unknown' ? 1 : 0,
      totalAttempts: 1,
      history: [{
        choice,
        reviewTime,
        date: new Date()
      }]
    });
    
    const newWordProgress = this.words[this.words.length - 1];
    const nextReviewData = this.calculateNextReview(newWordProgress, choice);
    Object.assign(newWordProgress, nextReviewData);
  } else {
    // 更新现有进度
    const nextReviewData = this.calculateNextReview(wordProgress, choice);
    
    wordProgress.lastChoice = choice;
    wordProgress.lastReviewed = new Date();
    wordProgress.reviewCount += 1;
    wordProgress.totalAttempts += 1;
    
    if (choice === 'know') {
      wordProgress.correctCount += 1;
      wordProgress.familiarity = Math.min(5, wordProgress.familiarity + 1);
    } else if (choice === 'unknown') {
      wordProgress.incorrectCount += 1;
      wordProgress.familiarity = Math.max(0, wordProgress.familiarity - 1);
    }
    
    // 更新状态
    if (wordProgress.familiarity >= 4 && wordProgress.correctCount >= 3) {
      wordProgress.status = 'mastered';
    } else if (wordProgress.familiarity >= 2) {
      wordProgress.status = 'familiar';
    } else {
      wordProgress.status = 'learning';
    }
    
    // 应用艾宾浩斯算法结果
    Object.assign(wordProgress, nextReviewData);
    
    // 添加历史记录
    wordProgress.history.push({
      choice,
      reviewTime,
      date: new Date()
    });
    
    // 限制历史记录数量
    if (wordProgress.history.length > 20) {
      wordProgress.history = wordProgress.history.slice(-20);
    }
  }
  
  // 更新整体进度
  this.updateOverallProgress();
  this.lastStudied = new Date();
  
  return this.save();
};

// 更新整体学习进度
learningProgressSchema.methods.updateOverallProgress = function() {
  const totalWords = this.words.length;
  if (totalWords === 0) {
    this.completionRate = 0;
    this.averageScore = 0;
    return;
  }
  
  // 计算完成率
  const masteredWords = this.words.filter(w => w.status === 'mastered').length;
  const familiarWords = this.words.filter(w => w.status === 'familiar').length;
  this.completionRate = Math.round(((masteredWords + familiarWords * 0.5) / totalWords) * 100);
  
  // 计算平均分数
  const totalCorrect = this.words.reduce((sum, w) => sum + w.correctCount, 0);
  const totalAttempts = this.words.reduce((sum, w) => sum + w.totalAttempts, 0);
  this.averageScore = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  
  // 检查是否完成
  this.isCompleted = this.completionRate >= 80;
};

// 获取需要复习的单词
learningProgressSchema.methods.getWordsForReview = function(limit = 10) {
  const now = new Date();
  return this.words
    .filter(w => w.nextReview <= now && w.status !== 'mastered')
    .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview))
    .slice(0, limit);
};

// 获取新单词（还未学习的）
learningProgressSchema.statics.getNewWords = async function(userId, wordlistId, limit = 10) {
  const Word = mongoose.model('Word');
  const progress = await this.findOne({ userId, wordlistId });
  
  let learnedWordIds = [];
  if (progress) {
    learnedWordIds = progress.words.map(w => w.wordId);
  }
  
  return Word.find({
    wordlistId,
    _id: { $nin: learnedWordIds },
    isActive: true
  }).limit(limit).sort({ order: 1 });
};

// 静态方法：初始化用户学习进度
learningProgressSchema.statics.initializeProgress = async function(userId, wordlistId) {
  try {
    // 使用findOneAndUpdate with upsert来避免重复键错误
    const progress = await this.findOneAndUpdate(
      { userId, wordlistId },
      {
        $setOnInsert: {
          userId,
          wordlistId,
          words: [],
          isFirstTime: true,
          startedAt: new Date(),
          lastStudied: new Date(),
          totalStudyTime: 0,
          completionRate: 0,
          averageScore: 0,
          isCompleted: false,
          studyMode: 'normal'
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    return progress;
  } catch (error) {
    console.error('初始化学习进度错误:', error);
    // 如果还是重复键错误，直接查找现有记录
    if (error.code === 11000) {
      return await this.findOne({ userId, wordlistId });
    }
    throw error;
  }
};

module.exports = mongoose.model('LearningProgress', learningProgressSchema); 