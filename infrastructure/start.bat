@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🎨 启动 WeDraw 基础设施服务...
echo.

REM 检查 Docker 和 Docker Compose
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose 未安装，请先安装 Docker Compose
    pause
    exit /b 1
)

REM 检查 .env 文件
if not exist ".env" (
    echo ❌ .env 文件不存在，请先创建环境配置文件
    pause
    exit /b 1
)

REM 创建必要的目录
echo 📁 创建必要的目录...
if not exist "database\data" mkdir "database\data"
if not exist "database\logs" mkdir "database\logs"
if not exist "redis\data" mkdir "redis\data"
if not exist "nginx\logs" mkdir "nginx\logs"
if not exist "prometheus\data" mkdir "prometheus\data"
if not exist "grafana\data" mkdir "grafana\data"

REM 停止可能存在的旧容器
echo 🛑 停止旧容器...
docker-compose down --remove-orphans

REM 拉取最新镜像
echo 📥 拉取最新镜像...
docker-compose pull

REM 启动服务
echo 🚀 启动基础设施服务...
docker-compose up -d

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 30 /nobreak >nul

REM 检查服务状态
echo 🔍 检查服务状态...
docker-compose ps
echo.

REM 健康检查
echo 🏥 执行健康检查...
echo.

REM 检查 MySQL
echo 检查 MySQL...
set mysql_ready=0
for /l %%i in (1,1,30) do (
    docker-compose exec -T mysql mysqladmin ping -h localhost --silent >nul 2>&1
    if not errorlevel 1 (
        echo ✅ MySQL 启动成功
        set mysql_ready=1
        goto :mysql_done
    )
    timeout /t 2 /nobreak >nul
)
if !mysql_ready! equ 0 (
    echo ❌ MySQL 启动失败
    pause
    exit /b 1
)
:mysql_done

REM 检查 Redis
echo 检查 Redis...
set redis_ready=0
for /l %%i in (1,1,30) do (
    docker-compose exec -T redis redis-cli ping | findstr "PONG" >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Redis 启动成功
        set redis_ready=1
        goto :redis_done
    )
    timeout /t 2 /nobreak >nul
)
if !redis_ready! equ 0 (
    echo ❌ Redis 启动失败
    pause
    exit /b 1
)
:redis_done

REM 检查 Nginx
echo 检查 Nginx...
set nginx_ready=0
for /l %%i in (1,1,30) do (
    curl -f http://localhost/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Nginx 启动成功
        set nginx_ready=1
        goto :nginx_done
    )
    timeout /t 2 /nobreak >nul
)
if !nginx_ready! equ 0 (
    echo ❌ Nginx 启动失败，但继续执行...
)
:nginx_done

REM 读取环境变量
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="MYSQL_ROOT_PASSWORD" set MYSQL_ROOT_PASSWORD=%%b
    if "%%a"=="GRAFANA_ADMIN_PASSWORD" set GRAFANA_ADMIN_PASSWORD=%%b
)

REM 初始化数据库
echo 🗄️ 初始化数据库...
docker-compose exec -T mysql mysql -u root -p%MYSQL_ROOT_PASSWORD% < database\init\01-create-databases.sql

echo.
echo 🎉 基础设施启动完成！
echo.
echo 📋 服务访问地址：
echo   🌐 管理面板: http://localhost (admin.wedraw.local)
echo   🚪 API网关: http://localhost/api
echo   📊 数据库管理: http://localhost/phpmyadmin
echo   🔴 Redis管理: http://localhost/redis
echo   📈 Grafana: http://localhost/grafana
echo   🔍 Prometheus: http://localhost/prometheus
echo.
echo 📝 默认账号信息：
echo   📊 phpMyAdmin: root / %MYSQL_ROOT_PASSWORD%
echo   🔴 Redis Commander: 无需认证
echo   📈 Grafana: admin / %GRAFANA_ADMIN_PASSWORD%
echo.
echo 🔧 管理命令：
echo   停止服务: docker-compose down
echo   查看日志: docker-compose logs -f [service_name]
echo   重启服务: docker-compose restart [service_name]
echo   查看状态: docker-compose ps
echo.
echo ✨ 基础设施已就绪，可以开始部署微服务！
echo.
pause