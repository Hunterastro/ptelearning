const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT身份验证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: '访问被拒绝，需要提供身份验证令牌' 
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 获取用户信息
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: '无效的令牌或用户已被禁用' 
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: '无效的令牌' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: '令牌已过期，请重新登录' 
      });
    }
    
    console.error('认证中间件错误:', error);
    return res.status(500).json({ 
      message: '服务器内部错误' 
    });
  }
};

// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: '请先登录' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: '权限不足，需要管理员权限' 
    });
  }

  next();
};

// 可选的身份验证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    req.user = user && user.isActive ? user : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 生成刷新令牌
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: '30d' }
  );
};

// 验证刷新令牌
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
    if (decoded.type !== 'refresh') {
      throw new Error('无效的刷新令牌类型');
    }
    return decoded;
  } catch (error) {
    throw new Error('无效的刷新令牌');
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
}; 