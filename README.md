# 英语学习网站

一个功能完整的英语学习平台，支持用户注册、登录，选择管理员上传的单词表进行学习，使用艾宾浩斯遗忘曲线算法优化学习效果。

## 🌟 核心功能

### 用户管理
- ✅ 用户注册和登录
- ✅ JWT身份验证和令牌刷新
- ✅ 用户资料管理
- ✅ 学习偏好设置
- ✅ 学习统计和进度跟踪

### 单词表管理
- ✅ 管理员上传Excel/CSV格式单词表
- ✅ 支持4列数据格式（短语、释义、例句、翻译）
- ✅ 文件解析和数据验证
- ✅ 单词表分类和难度设置
- ✅ 单词表搜索和筛选

### 学习功能
- ✅ 三选一学习模式（认识、不认识、模糊）
- ✅ 随机乱序展示单词
- ✅ 例句和释义显示
- ✅ 艾宾浩斯遗忘曲线算法
- ✅ 智能复习提醒
- ✅ 学习进度实时跟踪

### 记忆追踪与复习
- ✅ 基于艾宾浩斯遗忘曲线的复习安排
- ✅ 动态调整学习计划
- ✅ 记忆状态跟踪（新学、学习中、熟悉、掌握）
- ✅ 今日复习单词统计
- ✅ 学习报告和成就系统

### 移动端友好
- ✅ 响应式设计
- ✅ 移动设备优化
- ✅ 触摸友好的交互

## 🚀 技术栈

### 后端
- **Node.js** + **Express.js** - 服务器框架
- **MongoDB** + **Mongoose** - 数据库
- **JWT** - 身份验证
- **Multer** - 文件上传
- **XLSX** - Excel文件解析
- **bcryptjs** - 密码加密

### 前端
- **React 18** + **TypeScript** - 用户界面
- **Ant Design** - UI组件库
- **React Router** - 路由管理
- **React Query** - 数据获取和缓存
- **Styled Components** - 样式管理
- **Axios** - HTTP客户端

## 📦 项目结构

```
pte/
├── backend/
│   ├── models/           # 数据库模型
│   │   ├── User.js
│   │   ├── Wordlist.js
│   │   ├── Word.js
│   │   └── LearningProgress.js
│   ├── routes/           # API路由
│   │   ├── auth.js
│   │   ├── wordlist.js
│   │   ├── learning.js
│   │   └── user.js
│   ├── middleware/       # 中间件
│   │   ├── auth.js
│   │   └── upload.js
│   ├── utils/           # 工具函数
│   │   └── fileParser.js
│   ├── uploads/         # 文件上传目录
│   ├── package.json
│   └── server.js        # 服务器入口
├── frontend/
│   ├── src/
│   │   ├── components/   # React组件
│   │   ├── pages/       # 页面组件
│   │   ├── contexts/    # React上下文
│   │   ├── hooks/       # 自定义hooks
│   │   ├── services/    # API服务
│   │   ├── types/       # TypeScript类型定义
│   │   └── App.tsx      # 主应用组件
│   ├── public/
│   └── package.json
└── README.md
```

## 🛠️ 安装和运行

### 前置要求
- Node.js (v16+)
- MongoDB (v4.4+)
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd pte
```

### 2. 安装后端依赖
```bash
npm install
```

### 3. 安装前端依赖
```bash
cd frontend
npm install
cd ..
```

### 4. 环境配置
在项目根目录创建 `.env` 文件：
```env
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/english-learning

# JWT配置
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=5000
NODE_ENV=development

# 前端URL（用于CORS）
FRONTEND_URL=http://localhost:3000
```

### 5. 启动MongoDB
确保MongoDB服务正在运行：
```bash
# Windows
net start MongoDB

# macOS (使用Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 6. 启动应用

**开发模式（推荐）：**
```bash
# 启动后端服务器 (端口5000)
npm run dev

# 在另一个终端启动前端 (端口3000)
cd frontend
npm start
```

**生产模式：**
```bash
# 构建前端
cd frontend
npm run build
cd ..

# 启动后端服务器
npm start
```

### 7. 访问应用
- 前端：http://localhost:3000
- 后端API：http://localhost:5000/api

## 📖 使用指南

### 管理员操作
1. 注册账号后，需要手动将用户角色设置为 `admin`
2. 登录后可以上传Excel/CSV格式的单词表
3. 支持的文件格式：`.xlsx`, `.xls`, `.csv`
4. Excel/CSV文件应包含4列：英文短语、中文释义、例句、例句翻译

### 用户学习流程
1. 注册并登录账号
2. 浏览可用的单词表
3. 选择单词表开始学习
4. 对每个单词选择"认识"、"不认识"或"模糊"
5. 查看例句和释义加深理解
6. 系统自动安排复习时间
7. 查看学习进度和统计

### Excel/CSV文件格式示例
```
英文短语        | 中文释义     | 例句                                    | 例句翻译
make a decision | 做决定       | I need to make a decision about my job. | 我需要对我的工作做个决定。
take advantage  | 利用，占便宜  | You should take advantage of this opportunity. | 你应该利用这个机会。
```

## 🎯 艾宾浩斯算法说明

系统采用改进的艾宾浩斯遗忘曲线算法：

- **认识**：增加复习间隔，提高难度系数
- **模糊**：适度增加间隔，轻微降低难度系数  
- **不认识**：重置复习间隔，降低难度系数

复习间隔计算：
- 首次：1天
- 第二次：6天  
- 后续：间隔 × 难度系数

## 🔧 API接口文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌
- `GET /api/auth/me` - 获取用户信息

### 单词表接口
- `GET /api/wordlist` - 获取单词表列表
- `POST /api/wordlist/upload` - 上传单词表文件（管理员）
- `POST /api/wordlist/create` - 创建单词表（管理员）
- `GET /api/wordlist/:id/words` - 获取单词列表

### 学习接口
- `POST /api/learning/start/:wordlistId` - 开始学习
- `GET /api/learning/next/:wordlistId` - 获取下一个单词
- `POST /api/learning/submit/:wordlistId/:wordId` - 提交学习结果
- `GET /api/learning/progress/:wordlistId` - 获取学习进度

## 🚀 部署说明

### Docker部署（推荐）
```bash
# 构建镜像
docker build -t english-learning .

# 运行容器
docker run -p 5000:5000 -e MONGODB_URI=mongodb://host:27017/english-learning english-learning
```

### 传统部署
1. 构建前端项目
2. 将构建文件部署到Web服务器
3. 配置反向代理
4. 启动Node.js后端服务
5. 配置数据库连接

## 🤝 贡献指南

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持

如有问题或建议，请：
- 创建Issue
- 发送邮件至：[your-email@example.com]
- 加入讨论群：[QQ群号]

---

**快速开始学习英语吧！🎉** 