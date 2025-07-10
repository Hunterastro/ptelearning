@echo off
echo ========================================
echo 重新启动英语学习系统
echo ========================================
echo.

:: 设置Node.js路径
set "PATH=C:\Program Files\nodejs;%PATH%"
set "REACT_APP_API_URL=http://localhost:5000/api"

:: 停止所有Node.js进程
echo 🛑 停止现有服务...
taskkill /F /IM node.exe >nul 2>&1

:: 等待进程完全停止
timeout /t 3 /nobreak >nul

:: 启动后端
echo 🚀 启动后端服务器 (http://localhost:5000)...
start "后端服务器" cmd /k "cd /d %~dp0 && npm run dev"

:: 等待后端启动
timeout /t 8 /nobreak >nul

:: 启动前端
echo 🌐 启动前端应用 (http://localhost:3000)...
start "前端应用" cmd /k "cd /d %~dp0\frontend && npm start"

:: 等待前端启动
timeout /t 10 /nobreak >nul

echo.
echo ✅ 系统启动完成！
echo.
echo 📱 前端地址: http://localhost:3000
echo 🔧 后端API: http://localhost:5000/api
echo.
echo 💡 注册要求:
echo    • 用户名: 字母、数字、下划线、中文 (3-20字符)
echo    • 密码: 至少6位，必须包含字母和数字
echo    • 邮箱: 有效的邮箱格式
echo.
echo 🎯 现在可以测试注册功能了！
echo.
pause 