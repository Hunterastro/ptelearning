# 🔧 故障排除指南

## 🚨 Railway 部署失败

### 问题1: npm 依赖版本冲突
**错误信息**: 
```
npm ci can only install packages when your package.json and package-lock.json are in sync
```

**原因**: package.json 和 package-lock.json 文件中的依赖版本不匹配

**解决方案**:
```bash
# 1. 运行修复脚本
fix-deployment.bat

# 2. 手动修复（如果脚本失败）
git add .
git commit -m "修复依赖版本冲突"
git push origin main

# 3. 重新部署Railway
# 在Railway控制台点击 "Redeploy"
```

### 问题2: 构建超时
**症状**: 部署卡在构建阶段超过10分钟

**解决方案**:
1. 检查网络连接
2. 重试部署
3. 如果持续失败，考虑使用Render.com

## 🌐 Vercel 前端部署问题

### 问题1: 构建失败
**错误信息**: `Command "npm run build" exited with 1`

**解决方案**:
```bash
# 1. 本地测试构建
cd frontend
npm install
npm run build

# 2. 检查错误信息
# 3. 修复TypeScript/ESLint错误
# 4. 重新部署
```

### 问题2: 环境变量未生效
**症状**: 前端无法连接到后端API

**解决方案**:
1. 检查Vercel项目设置中的环境变量
2. 确保 `REACT_APP_API_URL` 正确设置
3. 重新部署前端

## 🗄️ MongoDB Atlas 连接问题

### 问题1: 认证失败
**错误信息**: `MongoServerError: Authentication failed`

**解决方案**:
1. 检查数据库用户名和密码
2. 确保用户有正确权限
3. 重新生成密码并更新连接字符串

### 问题2: 网络访问被拒绝
**错误信息**: `MongoNetworkError: connection timed out`

**解决方案**:
1. 检查Network Access设置
2. 添加 `0.0.0.0/0` 到IP白名单
3. 或者添加Railway/Render的出站IP

## 🔐 认证相关问题

### 问题1: JWT Token 错误
**症状**: 用户无法登录，收到401错误

**解决方案**:
1. 检查 `JWT_SECRET` 环境变量
2. 确保secret字符串足够长（建议32字符以上）
3. 重新生成JWT secret

### 问题2: CORS 错误
**错误信息**: `Access-Control-Allow-Origin header is missing`

**解决方案**:
1. 检查后端 `FRONTEND_URL` 环境变量
2. 确保前端域名正确配置
3. 重启后端服务

## 🔄 备选部署方案

### 方案A: Render.com（免费）
**优势**: 无时间限制，配置简单
**劣势**: 自动休眠，冷启动较慢

**部署步骤**:
1. 访问 [Render.com](https://render.com)
2. 连接GitHub仓库
3. 使用 `render.yaml` 配置
4. 配置环境变量

### 方案B: Fly.io（免费额度）
**优势**: 性能好，支持多区域
**劣势**: 配置复杂，免费额度有限

### 方案C: DigitalOcean App Platform
**优势**: 稳定，功能丰富
**劣势**: 免费试用后需付费

## 🛠️ 本地开发问题

### 问题1: npm 命令不可用
**症状**: `npm: 无法将"npm"项识别为 cmdlet`

**解决方案**:
1. 安装 Node.js：访问 [nodejs.org](https://nodejs.org)
2. 重启终端
3. 验证安装：`node --version`

### 问题2: MongoDB 连接失败
**解决方案**:
1. 使用MongoDB Atlas而不是本地MongoDB
2. 检查网络连接
3. 验证连接字符串格式

## 📊 性能优化

### 后端优化
```javascript
// 启用gzip压缩
app.use(compression());

// 设置缓存头
app.use(express.static('uploads', {
  maxAge: '1d'
}));
```

### 前端优化
```javascript
// 代码分割
const LazyComponent = React.lazy(() => import('./Component'));

// 图片优化
<img loading="lazy" src="..." alt="..." />
```

## 📞 获取帮助

### 1. 检查日志
- Railway: 项目 → Deploy → View Logs
- Vercel: 项目 → Functions → View Logs
- MongoDB Atlas: Security → Database Access

### 2. 运行诊断
```bash
# 验证部署状态
npm run verify https://your-app.railway.app

# 测试本地连接
curl http://localhost:5000/api/health
```

### 3. 常用调试命令
```bash
# 检查网络连接
ping your-app.railway.app

# 测试API端点
curl -X GET https://your-app.railway.app/api/health

# 检查DNS解析
nslookup your-app.railway.app
```

### 4. 社区支持
- Railway Discord: [railway.app/discord](https://railway.app/discord)
- Vercel Community: [vercel.com/community](https://vercel.com/community)
- MongoDB Community: [community.mongodb.com](https://community.mongodb.com)

---

如果以上方案都无法解决问题，请收集错误日志和配置信息，以便进一步诊断。 