@echo off
echo ========================================
echo 设置管理员权限
echo ========================================
echo.

:: 设置Node.js路径
set "PATH=C:\Program Files\nodejs;%PATH%"

:: 进入项目根目录
cd /d "%~dp0"

:: 运行设置脚本
echo 🔍 正在查找用户并设置管理员权限...
echo.
node set-admin.js

echo.
echo 设置完成！请重新登录以获取管理员权限。
echo.
pause 