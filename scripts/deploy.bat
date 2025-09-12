@echo off
setlocal enabledelayedexpansion

REM WeDraw Windows 部署脚本
REM 使用方法: deploy.bat [environment]
REM 环境选项: dev, staging, production

set "ENVIRONMENT=%~1"
if "%ENVIRONMENT%"=="" set "ENVIRONMENT=dev"

REM 验证环境参数
if not "%ENVIRONMENT%"=="dev" if not "%ENVIRONMENT%"=="staging" if not "%ENVIRONMENT%"=="production" (
    echo [ERROR] 无效的环境参数: %ENVIRONMENT%
    echo 使用方法: %0 [dev^|staging^|production]
    exit /b 1
)

echo [INFO] 开始部署到 %ENVIRONMENT% 环境...

REM 获取项目根目录
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

REM 检查部署要求
echo [INFO] 检查部署要求...

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 未安装
    exit /b 1
)

REM 检查 npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm 未安装
    exit /b 1
)

REM 检查 PM2
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PM2 未安装，正在安装...
    npm install -g pm2
    if errorlevel 1 (
        echo [ERROR] PM2 安装失败
        exit /b 1
    )
)

REM 检查环境变量文件
if not exist ".env" (
    if exist ".env.example" (
        echo [WARNING] 未找到 .env 文件，从 .env.example 复制...
        copy ".env.example" ".env"
        echo [WARNING] 请编辑 .env 文件并填入正确的配置
    ) else (
        echo [ERROR] 未找到 .env 或 .env.example 文件
        exit /b 1
    )
)

echo [SUCCESS] 要求检查完成

REM 安装项目依赖
echo [INFO] 安装项目依赖...

set "services=api-gateway user-center official wecom miniprogram points message analysis"
for %%s in (%services%) do (
    set "service_path=backend\%%s"
    if exist "!service_path!\package.json" (
        echo [INFO] 安装 %%s 依赖...
        cd /d "!service_path!"
        npm ci --only=production
        if errorlevel 1 (
            echo [ERROR] %%s 依赖安装失败
            exit /b 1
        )
        cd /d "%PROJECT_ROOT%"
    ) else (
        echo [WARNING] 跳过 %%s (目录或 package.json 不存在)
    )
)

echo [SUCCESS] 依赖安装完成

REM 创建必要目录
echo [INFO] 创建必要目录...
if not exist "logs" mkdir "logs"
if not exist "uploads" mkdir "uploads"
echo [SUCCESS] 目录创建完成

REM 启动服务
echo [INFO] 启动服务...

if "%ENVIRONMENT%"=="dev" (
    echo [INFO] 开发环境启动...
    pm2 start ecosystem.config.js
) else if "%ENVIRONMENT%"=="staging" (
    echo [INFO] 测试环境启动...
    pm2 start ecosystem.config.js --env staging
) else if "%ENVIRONMENT%"=="production" (
    echo [INFO] 生产环境启动...
    pm2 start ecosystem.config.js --env production
)

if errorlevel 1 (
    echo [ERROR] 服务启动失败
    exit /b 1
)

REM 等待服务启动
echo [INFO] 等待服务启动...
timeout /t 5 /nobreak >nul

REM 检查服务状态
pm2 status

echo [SUCCESS] 服务启动完成

REM 健康检查
echo [INFO] 执行健康检查...

REM 检查 API 网关（使用 PowerShell 的 Invoke-WebRequest）
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000/health' -UseBasicParsing | Out-Null; Write-Host '[SUCCESS] API网关健康检查通过' } catch { Write-Host '[ERROR] API网关健康检查失败' }"

REM 检查其他服务
set "ports=3001 3002 3003 3004 3005 3006 3007"
for %%p in (%ports%) do (
    powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:%%p/health' -UseBasicParsing | Out-Null; Write-Host '[SUCCESS] 端口 %%p 服务健康检查通过' } catch { Write-Host '[WARNING] 端口 %%p 服务健康检查失败' }"
)

echo [SUCCESS] 健康检查完成

REM 清理
echo [INFO] 执行部署后清理...
for /r %%f in (*.tmp) do del "%%f" 2>nul
for /r %%f in (*.log.old) do del "%%f" 2>nul
npm cache clean --force >nul 2>&1
echo [SUCCESS] 清理完成

REM 显示部署信息
echo.
echo [SUCCESS] === 部署完成 ===
echo.
echo [INFO] 环境: %ENVIRONMENT%
echo [INFO] API网关: http://localhost:3000
echo [INFO] 健康检查: http://localhost:3000/health
echo.
echo [INFO] 常用命令:
echo   查看状态: pm2 status
echo   查看日志: pm2 logs
echo   重启服务: pm2 restart ecosystem.config.js
echo   停止服务: pm2 stop ecosystem.config.js
echo   监控面板: pm2 monit
echo.
echo [SUCCESS] 部署完成！

pause