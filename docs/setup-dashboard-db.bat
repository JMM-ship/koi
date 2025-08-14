@echo off
echo ========================================
echo    Dashboard 数据库设置脚本
echo ========================================
echo.

echo [1/3] 生成 Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo 错误：Prisma Client 生成失败
    pause
    exit /b 1
)
echo 成功：Prisma Client 已生成
echo.

echo [2/3] 推送 Schema 更改到数据库...
call npx prisma db push
if %errorlevel% neq 0 (
    echo 错误：Schema 推送失败
    echo 请检查数据库连接配置
    pause
    exit /b 1
)
echo 成功：Schema 已更新
echo.

echo [3/3] 初始化测试数据（可选）...
echo 是否要初始化测试数据？(Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    call npx tsx scripts/seed-dashboard.ts
    if %errorlevel% neq 0 (
        echo 警告：测试数据初始化失败
    ) else (
        echo 成功：测试数据已初始化
    )
)

echo.
echo ========================================
echo    设置完成！
echo ========================================
echo.
echo 现在可以运行 npm run dev 启动开发服务器
echo.
pause