const axios = require('axios');

// 获取后端URL
const backendUrl = process.argv[2];

if (!backendUrl) {
  console.error('❌ 请提供后端URL');
  console.log('用法: node scripts/verify-deployment.js <backend-url>');
  console.log('示例: node scripts/verify-deployment.js https://your-app.railway.app');
  process.exit(1);
}

const API_BASE = backendUrl.endsWith('/') ? backendUrl + 'api' : backendUrl + '/api';

console.log('🧪 验证部署状态...');
console.log(`🔗 后端URL: ${backendUrl}`);
console.log(`🔗 API基础URL: ${API_BASE}`);
console.log('');

async function checkEndpoint(endpoint, description) {
  try {
    const url = `${API_BASE}${endpoint}`;
    console.log(`🔍 检查 ${description}...`);
    
    const response = await axios.get(url, { timeout: 10000 });
    console.log(`✅ ${description} - 状态: ${response.status}`);
    
    if (endpoint === '/health') {
      console.log(`   响应: ${JSON.stringify(response.data)}`);
    }
    return true;
  } catch (error) {
    console.log(`❌ ${description} - 错误: ${error.message}`);
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   响应: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testRegistration() {
  try {
    console.log('🔍 测试用户注册功能...');
    
    const testUser = {
      username: 'testuser_' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'testpass123',
      confirmPassword: 'testpass123'
    };

    const response = await axios.post(`${API_BASE}/auth/register`, testUser, { timeout: 10000 });
    console.log('✅ 用户注册功能正常');
    
    // 测试登录
    console.log('🔍 测试用户登录功能...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      login: testUser.email,
      password: testUser.password
    }, { timeout: 10000 });
    
    console.log('✅ 用户登录功能正常');
    console.log(`   获得Token: ${loginResponse.data.token ? '是' : '否'}`);
    
    return true;
  } catch (error) {
    console.log(`❌ 认证功能测试失败: ${error.message}`);
    if (error.response) {
      console.log(`   详细信息: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function verifyDeployment() {
  console.log('========================================');
  console.log('🚀 开始验证部署状态');
  console.log('========================================');
  console.log('');

  const checks = [
    { endpoint: '/health', description: '健康检查端点' },
    // { endpoint: '/wordlist', description: '词汇表API' },
  ];

  let passedChecks = 0;
  
  // 基础端点检查
  for (const check of checks) {
    const result = await checkEndpoint(check.endpoint, check.description);
    if (result) passedChecks++;
    console.log('');
  }

  // 认证功能测试
  const authTest = await testRegistration();
  if (authTest) passedChecks++;
  
  console.log('========================================');
  console.log('📊 验证结果统计');
  console.log('========================================');
  console.log(`✅ 通过检查: ${passedChecks}`);
  console.log(`❌ 失败检查: ${checks.length + 1 - passedChecks}`);
  
  if (passedChecks === checks.length + 1) {
    console.log('');
    console.log('🎉 恭喜！部署验证完全通过！');
    console.log('🔗 您的后端API已经正常运行');
    console.log('');
    console.log('📝 下一步：');
    console.log('   1. 访问前端应用进行最终测试');
    console.log('   2. 创建管理员账户');
    console.log('   3. 上传第一个词汇表');
    
    process.exit(0);
  } else {
    console.log('');
    console.log('⚠️  部署验证未完全通过');
    console.log('🔧 请检查：');
    console.log('   1. 环境变量配置是否正确');
    console.log('   2. 数据库连接是否正常');
    console.log('   3. Railway服务是否已完全启动');
    
    process.exit(1);
  }
}

verifyDeployment(); 