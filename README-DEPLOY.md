# 🚀 英语学习系统 - 免费部署版

一个完整的英语单词学习系统，支持词汇表管理、智能学习进度跟踪、用户管理等功能。

## ⚡ 快速部署

### 1️⃣ 准备工作 (5分钟)
```bash
# 运行部署设置助手
deploy-setup.bat

# 或手动创建配置文件
copy env.example .env
copy frontend/env.example frontend/.env
```

### 2️⃣ 配置数据库 (10分钟)
1. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 免费账户
2. 创建免费集群 (M0 Sandbox - 512MB)
3. 获取连接字符串
4. 编辑 `.env` 文件，填入数据库连接信息

### 3️⃣ 部署后端 (5分钟)
1. 上传代码到 GitHub
2. 登录 [Railway](https://railway.app)
3. 选择 "Deploy from GitHub repo"
4. 配置环境变量 (复制 `.env` 内容)

### 4️⃣ 部署前端 (5分钟)
1. 登录 [Vercel](https://vercel.com)
2. 选择 "New Project"
3. 设置 Root Directory 为 `frontend`
4. 配置环境变量 `REACT_APP_API_URL`

### 5️⃣ 完成 ✅
- 前端地址: `https://your-app.vercel.app`
- 后端地址: `https://your-app.railway.app`
- 总计耗时: **约25分钟**

## 💰 免费额度

| 服务 | 免费额度 | 限制 |
|------|---------|------|
| **Vercel** | 100GB带宽/月 | 无项目限制 |
| **Railway** | 500小时/月 | 512MB内存 |
| **MongoDB Atlas** | 512MB存储 | 500连接数 |

> 💡 对于个人使用完全足够！

## 📚 功能特性

- ✅ **用户认证**: 注册/登录/权限管理
- ✅ **词汇表管理**: Excel/CSV批量导入
- ✅ **智能学习**: 遗忘曲线算法
- ✅ **进度跟踪**: 详细学习统计
- ✅ **管理后台**: 用户和内容管理
- ✅ **响应式设计**: 支持手机/平板

## 🔧 技术栈

- **前端**: React + TypeScript + Ant Design
- **后端**: Node.js + Express + MongoDB
- **认证**: JWT + Refresh Token
- **部署**: Vercel + Railway + MongoDB Atlas

## 📖 详细指南

完整部署指南请查看: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

## 🆘 遇到部署问题？

### 🔧 Railway部署失败？
如果遇到npm依赖冲突错误，请查看：**[部署问题解决方案.md](./部署问题解决方案.md)**

### 📚 其他问题排除
- **完整故障排除**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **详细部署指南**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **部署检查清单**: [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)

### 🔧 快速修复工具
```bash
# 运行部署修复脚本
fix-deployment.bat

# 验证部署状态
npm run verify https://your-app.railway.app
```

---

�� **开始您的英语学习之旅吧！** 