const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `wordlist-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv'
  ];
  
  const allowedExts = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 Excel (.xlsx, .xls) 和 CSV (.csv) 文件格式'), false);
  }
};

// 创建multer实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
});

// 单文件上传中间件
const uploadSingle = upload.single('wordlist');

// 错误处理中间件
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          message: '文件大小超过限制（最大10MB）'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          message: '同时只能上传一个文件'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          message: '意外的文件字段'
        });
      default:
        return res.status(400).json({
          message: `文件上传错误: ${error.message}`
        });
    }
  } else if (error) {
    return res.status(400).json({
      message: error.message
    });
  }
  next();
};

// 文件验证中间件
const validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      message: '请选择要上传的文件'
    });
  }
  
  // 验证文件扩展名
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
    // 删除上传的文件
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      message: '不支持的文件格式，请上传 .xlsx, .xls 或 .csv 文件'
    });
  }
  
  next();
};

// 清理文件的工具函数
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('清理文件失败:', error);
  }
};

// 清理过期文件的定时任务
const cleanupOldFiles = () => {
  try {
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`已清理过期文件: ${file}`);
      }
    });
  } catch (error) {
    console.error('清理过期文件失败:', error);
  }
};

// 每小时执行一次清理
setInterval(cleanupOldFiles, 60 * 60 * 1000);

module.exports = {
  uploadSingle,
  handleUploadError,
  validateFile,
  cleanupFile
}; 