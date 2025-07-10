const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  wordlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wordlist',
    required: true,
    index: true
  },
  // Excel的4列数据结构
  phrase: {
    type: String,
    required: [true, '英文短语不能为空'],
    trim: true,
    index: true
  },
  meaning: {
    type: String,
    required: [true, '中文释义不能为空'],
    trim: true
  },
  example: {
    type: String,
    required: [true, '例句不能为空'],
    trim: true
  },
  translation: {
    type: String,
    required: [true, '例句翻译不能为空'],
    trim: true
  },
  // 额外的元数据
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String,
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true
  }],
  audioUrl: {
    type: String,
    default: ''
  },
  pronunciation: {
    type: String,
    default: ''
  },
  // 学习统计
  statistics: {
    totalViews: {
      type: Number,
      default: 0
    },
    correctCount: {
      type: Number,
      default: 0
    },
    incorrectCount: {
      type: Number,
      default: 0
    },
    difficultyRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 复合索引
wordSchema.index({ wordlistId: 1, order: 1 });
wordSchema.index({ wordlistId: 1, phrase: 1 });
wordSchema.index({ phrase: 'text', meaning: 'text', example: 'text' });

// 更新统计信息
wordSchema.methods.updateStatistics = function(isCorrect) {
  this.statistics.totalViews += 1;
  if (isCorrect) {
    this.statistics.correctCount += 1;
  } else {
    this.statistics.incorrectCount += 1;
  }
  
  // 计算难度评级
  const total = this.statistics.correctCount + this.statistics.incorrectCount;
  if (total > 0) {
    const accuracy = this.statistics.correctCount / total;
    this.statistics.difficultyRating = Math.round((1 - accuracy) * 5);
  }
  
  return this.save();
};

// 获取单词的学习状态
wordSchema.methods.getLearningStatus = async function(userId) {
  const LearningProgress = mongoose.model('LearningProgress');
  const progress = await LearningProgress.findOne({
    userId,
    wordlistId: this.wordlistId,
    'words.wordId': this._id
  }, {
    'words.$': 1
  });
  
  if (progress && progress.words.length > 0) {
    return progress.words[0];
  }
  
  return {
    wordId: this._id,
    status: 'new',
    familiarity: 0,
    lastReviewed: null,
    nextReview: new Date(),
    reviewCount: 0,
    correctCount: 0,
    incorrectCount: 0
  };
};

// 静态方法：批量导入单词
wordSchema.statics.bulkImport = async function(wordlistId, words) {
  const wordDocs = words.map((word, index) => ({
    wordlistId,
    phrase: word.phrase || word[0] || '',
    meaning: word.meaning || word[1] || '',
    example: word.example || word[2] || '',
    translation: word.translation || word[3] || '',
    order: index + 1,
    isActive: true
  }));
  
  return this.insertMany(wordDocs, { ordered: false });
};

// 静态方法：获取随机单词
wordSchema.statics.getRandomWords = async function(wordlistId, count = 10, excludeIds = []) {
  const pipeline = [
    { $match: { 
      wordlistId: new mongoose.Types.ObjectId(wordlistId), 
      isActive: true,
      _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) }
    }},
    { $sample: { size: count } }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Word', wordSchema); 