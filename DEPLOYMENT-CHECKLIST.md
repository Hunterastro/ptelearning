# ✅ 英语学习系统部署检查清单

按照此清单逐步操作，确保成功部署到免费云服务器。

## 📋 部署前准备

### 1. 账户注册
- [ ] 注册 [GitHub](https://github.com) 账户
- [ ] 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 账户
- [ ] 注册 [Railway](https://railway.app) 账户  
- [ ] 注册 [Vercel](https://vercel.com) 账户

### 2. 本地准备
- [ ] 项目代码已准备完毕
- [ ] 运行 `deploy-setup.bat` 创建配置文件
- [ ] 已安装 Git 并配置 GitHub

## 🗄️ 数据库配置 (MongoDB Atlas)

### 创建集群
- [ ] 登录 MongoDB Atlas
- [ ] 点击 "Build a Database"
- [ ] 选择 **FREE M0** 层级 (512MB)
- [ ] 选择距离最近的区域
- [ ] 等待集群创建完成 (~5分钟)

### 配置访问权限
- [ ] **Database Access** → 创建数据库用户
  - [ ] 用户名: `english-app-user`
  - [ ] 密码: 生成强密码并记录
  - [ ] 权限: "Read and write to any database"
- [ ] **Network Access** → 添加IP地址
  - [ ] 选择 "Allow access from anywhere" (0.0.0.0/0)

### 获取连接字符串
- [ ] 点击 "Connect" → "Connect your application"
- [ ] 复制连接字符串
- [ ] 替换 `<username>` 和 `<password>` 为实际值
- [ ] 添加数据库名称: `/english-learning`

**示例连接字符串:**
```
mongodb+srv://english-app-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/english-learning?retryWrites=true&w=majority
```

## 🖥️ 后端部署 (Railway)

### 准备代码
- [ ] 将项目上传到 GitHub 仓库
- [ ] 确保包含以下文件:
  - [ ] `package.json`
  - [ ] `railway.json`
  - [ ] `server.js`
  - [ ] 所有后端代码

### 部署到 Railway
- [ ] 登录 Railway
- [ ] 点击 "New Project" → "Deploy from GitHub repo"
- [ ] 选择您的英语学习系统仓库
- [ ] 等待自动检测和部署

### 配置环境变量
在 Railway 项目设置中添加:
- [ ] `MONGODB_URI` = 您的MongoDB连接字符串
- [ ] `JWT_SECRET` = 随机生成的32位字符串
- [ ] `JWT_REFRESH_SECRET` = 另一个32位字符串
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000`
- [ ] `FRONTEND_URL` = (稍后填写前端地址)

### 获取后端地址
- [ ] 记录 Railway 分配的域名: `https://your-project.railway.app`

## 🌐 前端部署 (Vercel)

### 部署设置
- [ ] 登录 Vercel
- [ ] 点击 "New Project"
- [ ] 选择您的 GitHub 仓库
- [ ] **Root Directory** 设置为 `frontend`
- [ ] 点击 "Deploy"

### 配置环境变量
在 Vercel 项目设置中添加:
- [ ] `REACT_APP_API_URL` = `https://your-project.railway.app/api`
- [ ] `GENERATE_SOURCEMAP` = `false`

### 获取前端地址
- [ ] 记录 Vercel 分配的域名: `https://your-project.vercel.app`

## 🔄 最终配置

### 更新后端CORS配置
- [ ] 回到 Railway 项目
- [ ] 更新 `FRONTEND_URL` 环境变量为前端地址
- [ ] 触发重新部署

## ✅ 验证部署

### 自动验证
```bash
# 本地运行验证脚本
npm run verify https://your-project.railway.app
```

### 手动验证
- [ ] 访问后端健康检查: `https://your-project.railway.app/api/health`
  - [ ] 应该返回: `{"status":"OK","message":"服务器运行正常",...}`
- [ ] 访问前端应用: `https://your-project.vercel.app`
  - [ ] 应该显示登录页面
  - [ ] 能够注册新用户
  - [ ] 能够成功登录

### 创建管理员
```bash
# 在 Railway 控制台运行
npm run create-admin your-email@example.com your-password
```

## 🎉 部署完成检查

- [ ] 前端页面正常加载
- [ ] 用户注册/登录功能正常
- [ ] 可以访问管理员面板
- [ ] 可以上传词汇表文件
- [ ] 学习功能正常工作
- [ ] 数据库正确保存数据

## 📊 免费额度监控

### 设置监控提醒
- [ ] Railway: 监控每月小时使用 (500小时限制)
- [ ] MongoDB Atlas: 监控存储使用 (512MB限制)
- [ ] Vercel: 监控带宽使用 (100GB限制)

### 定期检查 (建议每周)
- [ ] Railway 项目运行状态
- [ ] MongoDB Atlas 连接和存储
- [ ] Vercel 部署状态和带宽

## 🛠️ 故障排除

### 常见问题检查清单
- [ ] 环境变量是否正确配置
- [ ] 数据库连接字符串是否有效
- [ ] IP白名单是否包含 0.0.0.0/0
- [ ] 前后端URL是否相互匹配
- [ ] Railway 服务是否正在运行
- [ ] Vercel 构建是否成功

### 获取帮助
- [ ] 检查 Railway 部署日志
- [ ] 检查 Vercel 构建日志
- [ ] 检查浏览器开发者工具控制台

---

**🎯 部署成功标志:**
- ✅ 所有检查项都已完成
- ✅ 能够在前端正常使用所有功能
- ✅ 管理员能够管理用户和词汇表
- ✅ 学习系统运行流畅

**恭喜！您的英语学习系统已成功部署到云端！🚀** 