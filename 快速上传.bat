@echo off
chcp 65001 >nul
echo ========================================
echo    知识图谱系统 - Git 上传工具
echo ========================================
echo.

echo [步骤 1/5] 检查 Git 状态...
git status
echo.

echo [步骤 2/5] 添加所有文件到暂存区...
git add .
echo.

echo [步骤 3/5] 输入提交信息
echo 建议格式: feat: 添加智能问答和封面显示功能
set /p commit_msg="请输入提交信息: "
echo.

echo [步骤 4/5] 提交到本地仓库...
git commit -m "%commit_msg%"
echo.

echo [步骤 5/5] 推送到 GitHub...
git push
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo    上传成功！✓
    echo ========================================
) else (
    echo ========================================
    echo    上传失败，请查看错误信息
    echo ========================================
)

echo.
pause
