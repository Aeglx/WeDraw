# WeDraw 基础设施

这是 WeDraw 微服务架构的基础设施配置，包含数据库、缓存、反向代理、监控等核心服务。

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (反向代理)                      │
│                     Port: 80, 443                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                     │           微服务层                     │
│  ┌─────────────┐   │   ┌─────────────┐   ┌─────────────┐   │
│  │ API Gateway │   │   │ User Center │   │   WeWork    │   │
│  │   :3000     │   │   │    :3001    │   │    :3002    │   │
│  └─────────────┘   │   └─────────────┘   └─────────────┘   │
│                     │                                       │
│  ┌─────────────┐   │   ┌─────────────┐   ┌─────────────┐   │
│  │ MiniProgram │   │   │   WeChat    │   │ Points Mall │   │
│  │   :3003     │   │   │    :3004    │   │    :3005    │   │
│  └─────────────┘   │   └─────────────┘   └─────────────┘   │
│                     │                                       │
│  ┌─────────────┐   │                                       │
│  │Message Center│  │                                       │
│  │   :3006     │   │                                       │
│  └─────────────┘   │                                       │
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                     │          基础设施层                    │
│  ┌─────────────┐   │   ┌─────────────┐   ┌─────────────┐   │
│  │    MySQL    │   │   │    Redis    │   │ Prometheus  │   │
│  │   :3306     │   │   │    :6379    │   │    :9090    │   │
│  └─────────────┘   │   └─────────────┘   └─────────────┘   │
│                     │                                       │
│  ┌─────────────┐   │   ┌─────────────┐                     │
│  │  Grafana    │   │   │ Redis Cmd   │                     │
│  │   :3000     │   │   │    :8081    │                     │
│  └─────────────┘   │   └─────────────┘                     │
└─────────────────────┴───────────────────────────────────────┘
```

## 📦 服务组件

### 核心服务
- **MySQL 8.0**: 主数据库，支持多个微服务数据库
- **Redis 7.0**: 缓存和会话存储
- **Nginx**: 反向代理和负载均衡

### 管理工具
- **phpMyAdmin**: MySQL 数据库管理界面
- **Redis Commander**: Redis 缓存管理界面

### 监控服务
- **Prometheus**: 监控数据收集
- **Grafana**: 监控数据可视化

## 🚀 快速开始

### 环境要求
- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

### 启动服务

#### Windows
```bash
# 双击运行或在命令行执行
start.bat
```

#### Linux/macOS
```bash
# 添加执行权限
chmod +x start.sh

# 启动服务
./start.sh
```

#### 手动启动
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 管理面板 | http://localhost | 统一管理入口 |
| API网关 | http://localhost/api | 微服务API入口 |
| phpMyAdmin | http://localhost/phpmyadmin | 数据库管理 |
| Redis Commander | http://localhost/redis | Redis管理 |
| Grafana | http://localhost/grafana | 监控面板 |
| Prometheus | http://localhost/prometheus | 监控数据 |

## 🔐 默认账号

### MySQL
- **Root用户**: `root` / `wedraw_root_123`
- **服务用户**: 见数据库初始化脚本

### Redis
- **无密码**: 开发环境默认无密码

### Grafana
- **管理员**: `admin` / `wedraw_admin_123`

### phpMyAdmin
- **使用MySQL账号登录**

## 📁 目录结构

```
infrastructure/
├── docker-compose.yml          # Docker Compose 配置
├── .env                        # 环境变量配置
├── start.sh                    # Linux/macOS 启动脚本
├── start.bat                   # Windows 启动脚本
├── README.md                   # 说明文档
├── database/                   # MySQL 配置
│   ├── conf/
│   │   └── my.cnf             # MySQL 配置文件
│   ├── init/
│   │   └── 01-create-databases.sql  # 数据库初始化脚本
│   ├── data/                  # 数据文件目录
│   └── logs/                  # 日志文件目录
├── redis/                     # Redis 配置
│   ├── conf/
│   │   └── redis.conf         # Redis 配置文件
│   └── data/                  # 数据文件目录
├── nginx/                     # Nginx 配置
│   ├── conf/
│   │   ├── nginx.conf         # 主配置文件
│   │   └── conf.d/
│   │       ├── api-gateway.conf    # API网关配置
│   │       └── admin.conf          # 管理界面配置
│   └── logs/                  # 日志文件目录
├── prometheus/                # Prometheus 配置
│   └── data/                  # 数据文件目录
└── grafana/                   # Grafana 配置
    └── data/                  # 数据文件目录
```

## 🔧 管理命令

### 服务管理
```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart [service_name]

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [service_name]

# 进入容器
docker-compose exec [service_name] bash
```

### 数据库管理
```bash
# 连接 MySQL
docker-compose exec mysql mysql -u root -p

# 备份数据库
docker-compose exec mysql mysqldump -u root -p --all-databases > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u root -p < backup.sql
```

### Redis 管理
```bash
# 连接 Redis
docker-compose exec redis redis-cli

# 查看 Redis 信息
docker-compose exec redis redis-cli info

# 清空 Redis
docker-compose exec redis redis-cli flushall
```

## 📊 监控配置

### Prometheus 监控目标
- MySQL Exporter
- Redis Exporter
- Node Exporter
- 各微服务健康检查

### Grafana 仪表板
- 系统资源监控
- 数据库性能监控
- Redis 性能监控
- 微服务状态监控

## 🔒 安全配置

### 网络安全
- 服务间通信使用内部网络
- 只暴露必要的端口
- 使用强密码

### 数据安全
- 数据库用户权限最小化
- 定期备份数据
- 敏感信息使用环境变量

## 🐛 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :80
   
   # 修改 docker-compose.yml 中的端口映射
   ```

2. **权限问题**
   ```bash
   # Linux/macOS 设置目录权限
   sudo chown -R $USER:$USER ./data
   ```

3. **内存不足**
   ```bash
   # 检查系统资源
   docker system df
   docker system prune
   ```

4. **服务启动失败**
   ```bash
   # 查看详细日志
   docker-compose logs [service_name]
   
   # 重新构建镜像
   docker-compose build --no-cache [service_name]
   ```

### 健康检查
```bash
# 检查所有服务健康状态
curl http://localhost/health

# 检查 MySQL
docker-compose exec mysql mysqladmin ping

# 检查 Redis
docker-compose exec redis redis-cli ping
```

## 📈 性能优化

### MySQL 优化
- 调整 `my.cnf` 配置参数
- 定期优化表结构
- 监控慢查询日志

### Redis 优化
- 配置合适的内存策略
- 使用 Redis 集群（生产环境）
- 监控内存使用情况

### Nginx 优化
- 启用 Gzip 压缩
- 配置缓存策略
- 调整工作进程数

## 🔄 升级指南

1. **备份数据**
   ```bash
   ./backup.sh
   ```

2. **停止服务**
   ```bash
   docker-compose down
   ```

3. **更新配置**
   ```bash
   git pull origin main
   ```

4. **启动服务**
   ```bash
   ./start.sh
   ```

## 📞 技术支持

如遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查服务日志
3. 提交 Issue 到项目仓库

---

**注意**: 此配置适用于开发和测试环境。生产环境请根据实际需求调整安全配置、性能参数和高可用设置。