const mongoose = require('mongoose');
const User = require('./models/User');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/english-learning', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function setAdmin() {
  try {
    console.log('🔍 查找用户...');
    
    // 获取所有用户
    const users = await User.find({}).select('_id username email role createdAt');
    
    if (users.length === 0) {
      console.log('❌ 没有找到任何用户，请先注册一个账号');
      process.exit(1);
    }
    
    console.log('\n📋 现有用户列表:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - 角色: ${user.role || 'user'}`);
    });
    
    // 如果只有一个用户，自动设置为管理员
    if (users.length === 1) {
      const user = users[0];
      await User.findByIdAndUpdate(user._id, { role: 'admin' });
      console.log(`\n✅ 已将用户 "${user.username}" 设置为管理员`);
    } else {
      console.log('\n💡 请在MongoDB中手动设置管理员，或使用以下命令：');
      console.log('mongo');
      console.log('use english-learning');
      console.log(`db.users.updateOne({email: "您的邮箱"}, {$set: {role: "admin"}})`);
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

setAdmin(); 