const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profile: {
    nickname: {
      type: String,
      trim: true,
      maxlength: [30, '昵称最多30个字符']
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: [200, '个人简介最多200个字符']
    }
  },
  learningStats: {
    totalWordsLearned: {
      type: Number,
      default: 0
    },
    totalStudyTime: {
      type: Number,
      default: 0 // 以分钟为单位
    },
    consecutiveDays: {
      type: Number,
      default: 0
    },
    lastStudyDate: {
      type: Date
    },
    currentStreak: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    dailyGoal: {
      type: Number,
      default: 20 // 每日学习目标单词数
    },
    reviewInterval: {
      type: Number,
      default: 1 // 复习间隔（天）
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 获取用户公开信息
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// 更新学习统计
userSchema.methods.updateLearningStats = function(wordsLearned, studyTime) {
  const today = new Date();
  const lastStudy = this.learningStats.lastStudyDate;
  
  // 更新总学习词汇数和时间
  this.learningStats.totalWordsLearned += wordsLearned;
  this.learningStats.totalStudyTime += studyTime;
  
  // 更新连续学习天数
  if (lastStudy) {
    const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      this.learningStats.consecutiveDays += 1;
      this.learningStats.currentStreak += 1;
    } else if (daysDiff > 1) {
      this.learningStats.currentStreak = 1;
    }
  } else {
    this.learningStats.consecutiveDays = 1;
    this.learningStats.currentStreak = 1;
  }
  
  this.learningStats.lastStudyDate = today;
  return this.save();
};

// 索引
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema); 