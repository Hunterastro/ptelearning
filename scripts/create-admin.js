const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// 获取命令行参数
const email = process.argv[2];
const password = process.argv[3] || 'admin123456';

if (!email) {
  console.error('❌ 请提供管理员邮箱地址');
  console.log('用法: node scripts/create-admin.js <email> [password]');
  console.log('示例: node scripts/create-admin.js admin@example.com mypassword');
  process.exit(1);
}

async function createAdmin() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning');
    console.log('✅ 数据库连接成功');

    // 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`⚠️  用户 ${email} 已存在`);
      
      // 如果不是管理员，则升级为管理员
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`✅ 用户 ${email} 已升级为管理员`);
      } else {
        console.log(`✅ 用户 ${email} 已经是管理员`);
      }
    } else {
      // 创建新的管理员用户
      const adminUser = new User({
        username: email.split('@')[0] + '_admin',
        email: email,
        password: password,
        role: 'admin',
        isActive: true,
        profile: {
          nickname: '系统管理员',
          avatar: '',
          bio: '系统管理员账户'
        }
      });

      await adminUser.save();
      console.log(`✅ 管理员账户创建成功:`);
      console.log(`   邮箱: ${email}`);
      console.log(`   密码: ${password}`);
      console.log(`   用户名: ${adminUser.username}`);
    }

    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
    process.exit(0);

  } catch (error) {
    console.error('❌ 创建管理员失败:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin(); 