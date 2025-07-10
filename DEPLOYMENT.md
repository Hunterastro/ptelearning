# 🚀 英语学习系统部署指南

本指南将帮助您将英语学习系统免费部署到云端服务器。

## 📋 部署架构

- **前端**: Vercel (免费，无限制)
- **后端**: Railway (免费500小时/月)
- **数据库**: MongoDB Atlas (免费512MB)

## 🔧 第一步：准备数据库 (MongoDB Atlas)

### 1. 注册 MongoDB Atlas
1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 点击 "Try Free" 注册免费账户
3. 验证邮箱并登录

### 2. 创建集群
1. 选择 "Build a Database"
2. 选择 **FREE** 层级 (M0 Sandbox)
3. 选择离您最近的区域 (推荐: AWS Singapore)
4. 集群名称可以保持默认
5. 点击 "Create Cluster"

### 3. 配置数据库访问
1. **Database Access** → "Add New Database User"
   - 用户名: `english-app-user` 
   - 密码: 生成强密码并保存
   - 权限: 选择 "Read and write to any database"

2. **Network Access** → "Add IP Address"
   - 选择 "Allow access from anywhere" (0.0.0.0/0)
   - 或者添加特定IP地址

### 4. 获取连接字符串
1. 点击 "Connect" → "Connect your application"
2. 选择 Driver: Node.js, Version: 4.1 or later
3. 复制连接字符串，格式如下:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. 将 `<username>` 和 `<password>` 替换为实际值

## 🖥️ 第二步：部署后端 (Railway)

### 1. 准备 GitHub 仓库
1. 将项目上传到 GitHub
2. 确保包含所有后端文件和 `railway.json` 配置

### 2. 部署到 Railway
1. 访问 [Railway](https://railway.app)
2. 使用 GitHub 账户登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择您的英语学习系统仓库
5. Railway 会自动检测到 Node.js 项目并开始部署

### 3. 配置环境变量
在 Railway 项目设置中添加以下环境变量:

```bash
# 必需的环境变量
MONGODB_URI=mongodb+srv://english-app-user:your-password@cluster0.xxxxx.mongodb.net/english-learning?retryWrites=true&w=majority

JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-random-string
JWT_REFRESH_SECRET=your-different-refresh-secret-also-32-characters-minimum

NODE_ENV=production
PORT=5000

# 前端URL (稍后更新)
FRONTEND_URL=https://your-frontend-app.vercel.app
```

### 4. 自定义域名 (可选)
1. 在 Railway 项目中点击 "Settings" → "Domains"
2. 可以使用默认的 `.railway.app` 域名
3. 记录您的后端 URL: `https://your-project-name.railway.app`

## 🌐 第三步：部署前端 (Vercel)

### 1. 准备前端代码
1. 确保前端代码在独立的 GitHub 仓库中，或在主仓库的 `frontend` 文件夹中
2. 确保包含 `vercel.json` 配置文件

### 2. 部署到 Vercel
1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账户登录
3. 点击 "New Project"
4. 选择您的英语学习系统仓库
5. 如果前端在子文件夹中，设置 "Root Directory" 为 `frontend`
6. 点击 "Deploy"

### 3. 配置环境变量
在 Vercel 项目设置中添加:

```bash
REACT_APP_API_URL=https://your-backend-name.railway.app/api
GENERATE_SOURCEMAP=false
```

### 4. 更新后端的 FRONTEND_URL
1. 记录您的前端URL: `https://your-frontend-app.vercel.app`
2. 回到 Railway，更新 `FRONTEND_URL` 环境变量为这个地址
3. 重新部署后端

## ✅ 第四步：验证部署

### 1. 检查后端
访问: `https://your-backend-name.railway.app/api/health`
应该看到: `{"status":"OK","message":"服务器运行正常",...}`

### 2. 检查前端
访问: `https://your-frontend-app.vercel.app`
应该能看到登录页面

### 3. 创建管理员账户
```bash
# 使用Railway的控制台功能
node set-admin.js your-email@example.com
```

## 🛠️ 常见问题解决

### CORS 错误
- 确保后端的 `FRONTEND_URL` 环境变量正确
- 检查前端的 `REACT_APP_API_URL` 是否正确

### 数据库连接失败
- 检查MongoDB Atlas的IP白名单
- 验证连接字符串中的用户名和密码
- 确保数据库用户有正确权限

### 文件上传问题
- Railway 的临时文件系统有限制
- 考虑使用云存储服务 (如 AWS S3)

### 部署失败
- 检查 `package.json` 中的 engines 字段
- 确保所有依赖都在 dependencies 中

## 📊 免费额度限制

### MongoDB Atlas (免费层)
- 存储: 512MB
- 连接数: 500
- 无时间限制

### Railway (免费层)
- 使用时间: 500小时/月
- 内存: 512MB
- 存储: 1GB

### Vercel (免费层)
- 带宽: 100GB/月
- 函数执行: 100GB小时/月
- 无项目数量限制

## 🔧 维护建议

1. **定期备份数据**: 使用 MongoDB Atlas 的备份功能
2. **监控使用量**: 关注 Railway 的小时使用情况
3. **更新依赖**: 定期更新项目依赖包
4. **安全检查**: 定期检查和更新密钥

## 🆕 升级选项

如果需要更多资源:
- **Railway Pro**: $5/月 (无小时限制)
- **MongoDB Atlas Dedicated**: $57/月起
- **Vercel Pro**: $20/月 (更多带宽和功能)

---

部署完成后，您就拥有了一个完全免费的在线英语学习系统！ 🎉 