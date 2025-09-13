#!/bin/bash

# WeDraw 基础设施启动脚本

set -e

echo "🎨 启动 WeDraw 基础设施服务..."

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在，请先创建环境配置文件"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p database/data
mkdir -p database/logs
mkdir -p redis/data
mkdir -p nginx/logs
mkdir -p prometheus/data
mkdir -p grafana/data

# 设置目录权限
echo "🔐 设置目录权限..."
sudo chown -R 999:999 database/data database/logs
sudo chown -R 999:999 redis/data
sudo chown -R 472:472 grafana/data
sudo chown -R 65534:65534 prometheus/data

# 停止可能存在的旧容器
echo "🛑 停止旧容器..."
docker-compose down --remove-orphans

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker-compose pull

# 启动服务
echo "🚀 启动基础设施服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 健康检查
echo "🏥 执行健康检查..."

# 检查 MySQL
echo "检查 MySQL..."
for i in {1..30}; do
    if docker-compose exec -T mysql mysqladmin ping -h localhost --silent; then
        echo "✅ MySQL 启动成功"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ MySQL 启动失败"
        exit 1
    fi
    sleep 2
done

# 检查 Redis
echo "检查 Redis..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
        echo "✅ Redis 启动成功"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Redis 启动失败"
        exit 1
    fi
    sleep 2
done

# 检查 Nginx
echo "检查 Nginx..."
for i in {1..30}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Nginx 启动成功"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Nginx 启动失败"
        exit 1
    fi
    sleep 2
done

# 初始化数据库
echo "🗄️ 初始化数据库..."
docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} < database/init/01-create-databases.sql

echo "🎉 基础设施启动完成！"
echo ""
echo "📋 服务访问地址："
echo "  🌐 管理面板: http://localhost (admin.wedraw.local)"
echo "  🚪 API网关: http://localhost/api"
echo "  📊 数据库管理: http://localhost/phpmyadmin"
echo "  🔴 Redis管理: http://localhost/redis"
echo "  📈 Grafana: http://localhost/grafana"
echo "  🔍 Prometheus: http://localhost/prometheus"
echo ""
echo "📝 默认账号信息："
echo "  📊 phpMyAdmin: root / ${MYSQL_ROOT_PASSWORD}"
echo "  🔴 Redis Commander: 无需认证"
echo "  📈 Grafana: admin / ${GRAFANA_ADMIN_PASSWORD}"
echo ""
echo "🔧 管理命令："
echo "  停止服务: docker-compose down"
echo "  查看日志: docker-compose logs -f [service_name]"
echo "  重启服务: docker-compose restart [service_name]"
echo "  查看状态: docker-compose ps"
echo ""
echo "✨ 基础设施已就绪，可以开始部署微服务！"