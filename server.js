const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const wordlistRoutes = require('./routes/wordlist');
const learningRoutes = require('./routes/learning');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

// 改进的CORS配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的源
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // 如果没有origin（比如移动应用或Postman），也允许
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // 在开发环境中暂时允许所有来源
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200, // 为了支持旧浏览器
  preflightContinue: false
};

app.use(cors(corsOptions));

// 安全中间件 - 放在CORS之后
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 1000, // 增加限制，避免开发时触发
  message: { message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 添加请求日志中间件（开发环境）
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin') || 'No Origin'}`);
    next();
  });
}

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB 连接成功');
}).catch((err) => {
  console.error('❌ MongoDB 连接失败:', err);
  process.exit(1);
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/wordlist', wordlistRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/user', userRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: '请求的资源不存在' });
});

// 处理生产环境的静态文件
if (process.env.NODE_ENV === 'production') {
  // 如果前端构建文件在同一个服务器上（可选）
  const path = require('path');
  app.use(express.static(path.join(__dirname, 'frontend/build')));
  
  // 所有其他路由返回前端应用（SPA支持）
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API 端点不存在' });
    }
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`);
  if (process.env.FRONTEND_URL) {
    console.log(`🌐 CORS 已启用，允许来源: ${process.env.FRONTEND_URL}`);
  }
});

module.exports = app; 