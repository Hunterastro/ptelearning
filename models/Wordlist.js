const mongoose = require('mongoose');

const wordlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '单词表名称不能为空'],
    trim: true,
    maxlength: [100, '单词表名称最多100个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '描述最多500个字符']
  },
  category: {
    type: String,
    enum: ['PTE', 'IELTS', 'TOEFL', 'Business', 'Academic', 'General', 'Other'],
    default: 'General'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  wordCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  statistics: {
    totalUsers: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    }
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 更新单词数量
wordlistSchema.methods.updateWordCount = async function() {
  const Word = mongoose.model('Word');
  const count = await Word.countDocuments({ wordlistId: this._id });
  this.wordCount = count;
  return this.save();
};

// 更新统计信息
wordlistSchema.methods.updateStatistics = async function() {
  const LearningProgress = mongoose.model('LearningProgress');
  
  // 计算使用该单词表的用户数
  const totalUsers = await LearningProgress.distinct('userId', { wordlistId: this._id });
  this.statistics.totalUsers = totalUsers.length;
  
  // 计算完成率和平均分数
  const progressData = await LearningProgress.aggregate([
    { $match: { wordlistId: this._id } },
    {
      $group: {
        _id: null,
        avgCompletionRate: { $avg: '$completionRate' },
        avgScore: { $avg: '$averageScore' }
      }
    }
  ]);
  
  if (progressData.length > 0) {
    this.statistics.completionRate = Math.round(progressData[0].avgCompletionRate || 0);
    this.statistics.averageScore = Math.round(progressData[0].avgScore || 0);
  }
  
  return this.save();
};

// 索引
wordlistSchema.index({ name: 1 });
wordlistSchema.index({ category: 1 });
wordlistSchema.index({ difficulty: 1 });
wordlistSchema.index({ createdBy: 1 });
wordlistSchema.index({ isActive: 1, isPublic: 1 });
wordlistSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Wordlist', wordlistSchema); 