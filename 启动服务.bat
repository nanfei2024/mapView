@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   🚀 地质文档数字化系统 - 双服务器启动        ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo 📌 正在启动两个服务器...
echo.
echo ┌─────────────────────────────────────────────┐
echo │  1️⃣  代理服务器: http://localhost:3001      │
echo │  2️⃣  开发服务器: http://localhost:5173      │
echo └─────────────────────────────────────────────┘
echo.
echo ⚙️  启动中，请稍候...
echo.

REM 启动代理服务器（新窗口）
start "🔄 CORS代理服务器 (端口:3001)" cmd /k "npm run proxy"

REM 等待 2 秒
timeout /t 2 /nobreak >nul

REM 启动开发服务器（新窗口）
start "🌐 开发服务器 (端口:5173)" cmd /k "npm run dev"

echo.
echo ✅ 服务器启动完成！
echo.
echo 📝 使用说明:
echo    1. 等待两个新窗口完全启动
echo    2. 访问 http://localhost:5173
echo    3. 关闭时请关闭所有窗口
echo.
echo 💡 提示: 请保持两个服务器窗口运行！
echo.
pause


