@echo off
echo ========================================
echo MongoDB数据库检查工具
echo ========================================
echo.

:: 设置Node.js路径
set "PATH=C:\Program Files\nodejs;%PATH%"

:: 进入项目根目录
cd /d "%~dp0"

echo 🔍 正在检查MongoDB数据库...
echo.

:: 运行数据库检查脚本
node check-database.js

echo.
echo 📝 如果没有找到用户数据，请：
echo    1. 确认已成功注册账号
echo    2. 检查后端控制台是否有错误
echo    3. 重新尝试注册
echo.
pause 