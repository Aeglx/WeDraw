#!/bin/bash

# WeDraw 部署脚本
# 使用方法: ./scripts/deploy.sh [environment]
# 环境选项: dev, staging, production

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
ENVIRONMENT=${1:-dev}
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    log_error "无效的环境参数: $ENVIRONMENT"
    log_info "使用方法: $0 [dev|staging|production]"
    exit 1
fi

log_info "开始部署到 $ENVIRONMENT 环境..."

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 检查必要文件
check_requirements() {
    log_info "检查部署要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 未安装，正在安装..."
        npm install -g pm2
    fi
    
    # 检查环境变量文件
    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.example" ]]; then
            log_warning "未找到 .env 文件，从 .env.example 复制..."
            cp .env.example .env
            log_warning "请编辑 .env 文件并填入正确的配置"
        else
            log_error "未找到 .env 或 .env.example 文件"
            exit 1
        fi
    fi
    
    log_success "要求检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 服务列表
    services=("api-gateway" "user-center" "official" "wecom" "miniprogram" "points" "message" "analysis")
    
    for service in "${services[@]}"; do
        service_path="backend/$service"
        if [[ -d "$service_path" && -f "$service_path/package.json" ]]; then
            log_info "安装 $service 依赖..."
            cd "$service_path"
            npm ci --only=production
            cd "$PROJECT_ROOT"
        else
            log_warning "跳过 $service (目录或 package.json 不存在)"
        fi
    done
    
    log_success "依赖安装完成"
}

# 数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."
    
    # 检查 MySQL 连接
    if ! command -v mysql &> /dev/null; then
        log_warning "MySQL 客户端未安装，跳过数据库迁移"
        return
    fi
    
    # 读取数据库配置
    source .env
    
    # 运行迁移脚本
    migration_files=("database/migrations/"*.sql)
    for file in "${migration_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_info "执行迁移: $(basename "$file")"
            mysql -h"${DB_HOST:-localhost}" -P"${DB_PORT:-3306}" -u"${DB_USER:-root}" -p"${DB_PASSWORD}" < "$file" || {
                log_warning "迁移文件 $file 执行失败，可能已经执行过"
            }
        fi
    done
    
    log_success "数据库迁移完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 创建必要目录
    mkdir -p logs uploads
    
    # 设置权限
    chmod -R 755 logs uploads
    
    log_success "项目构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    case $ENVIRONMENT in
        "dev")
            log_info "开发环境启动..."
            pm2 start ecosystem.config.js
            ;;
        "staging")
            log_info "测试环境启动..."
            pm2 start ecosystem.config.js --env staging
            ;;
        "production")
            log_info "生产环境启动..."
            pm2 start ecosystem.config.js --env production
            ;;
    esac
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    pm2 status
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查 API 网关
    if curl -f http://localhost:3000/health &> /dev/null; then
        log_success "API网关健康检查通过"
    else
        log_error "API网关健康检查失败"
        return 1
    fi
    
    # 检查其他服务
    services=(3001 3002 3003 3004 3005 3006 3007)
    for port in "${services[@]}"; do
        if curl -f "http://localhost:$port/health" &> /dev/null; then
            log_success "端口 $port 服务健康检查通过"
        else
            log_warning "端口 $port 服务健康检查失败"
        fi
    done
    
    log_success "健康检查完成"
}

# 部署后清理
cleanup() {
    log_info "执行部署后清理..."
    
    # 清理临时文件
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name "*.log.old" -delete 2>/dev/null || true
    
    # 清理 npm 缓存
    npm cache clean --force &> /dev/null || true
    
    log_success "清理完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "=== 部署完成 ==="
    echo
    log_info "环境: $ENVIRONMENT"
    log_info "API网关: http://localhost:3000"
    log_info "健康检查: http://localhost:3000/health"
    echo
    log_info "常用命令:"
    echo "  查看状态: pm2 status"
    echo "  查看日志: pm2 logs"
    echo "  重启服务: pm2 restart ecosystem.config.js"
    echo "  停止服务: pm2 stop ecosystem.config.js"
    echo "  监控面板: pm2 monit"
    echo
}

# 错误处理
trap 'log_error "部署过程中发生错误，退出码: $?"' ERR

# 主部署流程
main() {
    log_info "开始 WeDraw 部署流程..."
    
    check_requirements
    install_dependencies
    
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        run_migrations
    fi
    
    build_project
    start_services
    health_check
    cleanup
    show_deployment_info
    
    log_success "部署完成！"
}

# 执行主函数
main "$@"