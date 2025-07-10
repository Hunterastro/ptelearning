const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  authenticateToken 
} = require('../middleware/auth');

const router = express.Router();

// 用户注册
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文字符'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个字母和一个数字'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('确认密码与密码不匹配');
      }
      return true;
    })
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // 生成令牌
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: '注册成功',
      user: user.getPublicProfile(),
      token,
      refreshToken
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      message: '注册失败，请稍后重试'
    });
  }
});

// 用户登录
router.post('/login', [
  body('login')
    .notEmpty()
    .withMessage('请输入用户名或邮箱'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { login, password } = req.body;

    // 查找用户（支持用户名或邮箱登录）
    const user = await User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { username: login }
      ],
      isActive: true
    });

    if (!user) {
      return res.status(401).json({
        message: '用户名/邮箱或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: '用户名/邮箱或密码错误'
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成令牌
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: '登录成功',
      user: user.getPublicProfile(),
      token,
      refreshToken
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      message: '登录失败，请稍后重试'
    });
  }
});

// 刷新令牌
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新令牌不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // 验证刷新令牌
    const decoded = verifyRefreshToken(refreshToken);
    
    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: '无效的刷新令牌'
      });
    }

    // 生成新的访问令牌
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      message: '令牌刷新成功',
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(401).json({
      message: '无效的刷新令牌'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      message: '获取用户信息失败'
    });
  }
});

// 更新用户信息
router.put('/profile', authenticateToken, [
  body('nickname')
    .optional()
    .isLength({ max: 30 })
    .withMessage('昵称最多30个字符'),
  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('个人简介最多200个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { nickname, bio } = req.body;
    const user = req.user;

    // 更新用户信息
    if (nickname !== undefined) {
      user.profile.nickname = nickname;
    }
    if (bio !== undefined) {
      user.profile.bio = bio;
    }

    await user.save();

    res.json({
      message: '用户信息更新成功',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      message: '更新用户信息失败'
    });
  }
});

// 修改密码
router.put('/password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('请输入当前密码'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码至少需要6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('新密码必须包含至少一个字母和一个数字'),
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认密码与新密码不匹配');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // 验证当前密码
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        message: '当前密码错误'
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      message: '密码修改失败'
    });
  }
});

// 登出（客户端删除令牌即可）
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: '登出成功'
  });
});

module.exports = router; 