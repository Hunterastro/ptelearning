@echo off
chcp 65001 > nul
echo ========================================
echo 🚀 英语学习系统部署设置助手
echo ========================================
echo.

echo 📋 请确保您已经完成以下步骤：
echo    1. 创建了 MongoDB Atlas 免费账户
echo    2. 获取了数据库连接字符串
echo    3. 准备了 GitHub 账户
echo.

pause

echo 🔧 正在准备部署配置...
echo.

:: 创建后端环境变量文件
echo 📝 创建后端环境变量文件...
if not exist .env (
    copy env.example .env > nul
    echo ✅ 已创建 .env 文件，请编辑其中的配置
) else (
    echo ⚠️  .env 文件已存在，跳过创建
)

:: 创建前端环境变量文件
echo 📝 创建前端环境变量文件...
cd frontend
if not exist .env (
    copy env.example .env > nul
    echo ✅ 已创建前端 .env 文件，请编辑其中的配置
) else (
    echo ⚠️  前端 .env 文件已存在，跳过创建
)
cd ..

echo.
echo ========================================
echo ✅ 设置完成！
echo ========================================
echo.
echo 📝 下一步操作：
echo    1. 编辑根目录的 .env 文件，填入您的 MongoDB 连接字符串
echo    2. 编辑 frontend/.env 文件，配置前端环境变量
echo    3. 将项目上传到 GitHub
echo    4. 按照 DEPLOYMENT.md 指南进行部署
echo.
echo 📚 详细部署指南请查看 DEPLOYMENT.md 文件
echo.

pause 