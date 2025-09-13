# WeDraw - 企业微信生态管理平台

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/Aeglx/WeDraw?style=social)
![GitHub forks](https://img.shields.io/github/forks/Aeglx/WeDraw?style=social)
![GitHub issues](https://img.shields.io/github/issues/Aeglx/WeDraw)
![GitHub license](https://img.shields.io/github/license/Aeglx/WeDraw)

</div>

> 基于微服务架构的企业微信、公众号、小程序及积分商城一体化管理平台

## 📖 项目简介

WeDraw 是一个完整的企业微信生态管理平台，采用微服务架构设计，支持公众号管理、企业微信管理、小程序管理和积分商城等核心功能。平台提供统一的管理后台，帮助企业高效管理微信生态下的用户运营、消息推送、数据分析和积分营销活动。

## ✨ 核心特性

- 🏗️ **微服务架构** - 各业务模块独立开发、部署与扩展
- 🔐 **统一认证** - 基于JWT的无状态认证和RBAC权限模型
- 📱 **多端支持** - 支持管理后台、H5页面、小程序等多种客户端
- 🚀 **高性能** - Redis缓存、数据库优化、接口限流等性能保障
- 🔧 **易部署** - 支持Docker容器化部署和传统部署方式
- 📊 **数据分析** - 完整的数据统计和可视化报表功能
## 🏗️ 系统架构

### 架构概览

```
客户端层 → API网关层 → 微服务层 → 数据存储层 → 基础设施层
```

- **客户端层**: 管理后台、H5页面、小程序等多端应用
- **API网关层**: 统一请求入口，处理路由、认证、限流
- **微服务层**: 8个独立后端服务，按业务域拆分
- **数据存储层**: MySQL + Redis，按服务独立部署
- **基础设施层**: 日志、监控、消息队列等支撑组件


## 📁 项目结构

```
WeDraw/
├── backend/                    # 后端微服务
│   ├── api-gateway/           # API网关服务
│   ├── user-center/           # 用户中心服务
│   ├── wechat-official/       # 公众号服务
│   ├── wecom-service/         # 企业微信服务
│   ├── miniprogram-service/   # 小程序服务
│   ├── points-mall/           # 积分商城服务
│   ├── message-center/        # 消息中心服务
│   ├── data-analysis/         # 数据分析服务
│   └── shared/                # 共享模块
├── frontend/                   # 前端应用
│   ├── admin/                 # 管理后台
│   ├── wechat-h5/            # 公众号H5页面
│   ├── wecom-h5/             # 企业微信H5页面
│   ├── miniprogram/          # 小程序
│   ├── points-h5/            # 积分商城H5
│   └── shared/               # 前端共享组件
├── infrastructure/            # 基础设施配置
│   ├── database/             # 数据库脚本
│   ├── nginx/                # Nginx配置
│   └── redis/                # Redis配置
└── docs/                     # 项目文档
```



## 🚀 功能模块

### 📱 前端应用

| 应用 | 功能描述 | 技术栈 |
|------|----------|--------|
| **管理后台** | 统一管理入口，支持多角色权限管理 | Vue 3 + Element Plus |
| **公众号H5** | 公众号菜单页面、粉丝互动功能 | Vue 3 + Vant + 微信JS-SDK |
| **企业微信H5** | 企业微信应用页面、通讯录管理 | Vue 3 + Vant + 企业微信JS-SDK |
| **小程序** | 小程序用户端，积分查询等功能 | Vue 3 + UniApp |
| **积分商城H5** | 积分兑换、商品浏览、订单管理 | Vue 3 + Vant |

### 🔧 后端服务

| 服务 | 功能描述 | 端口 |
|------|----------|------|
| **API网关** | 统一入口、路由转发、认证鉴权 | 3000 |
| **用户中心** | 用户管理、角色权限、统一认证 | 3001 |
| **公众号服务** | 粉丝管理、消息推送、菜单配置 | 3002 |
| **企业微信服务** | 通讯录、群聊、机器人管理 | 3003 |
| **小程序服务** | 小程序用户、模板消息 | 3004 |
| **积分商城** | 积分管理、商品管理、订单处理 | 3005 |
| **消息中心** | 多渠道消息发送、模板管理 | 3006 |
| **数据分析** | 数据统计、报表生成 | 3007 |

## 🛠️ 技术栈

### 前端技术
- **框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **UI组件**: Element Plus (管理后台) + Vant (移动端)
- **跨端**: UniApp (小程序)

### 后端技术
- **运行环境**: Node.js 16.x
- **Web框架**: Express
- **ORM**: Sequelize
- **认证**: JWT + RBAC权限模型

### 数据存储
- **数据库**: MySQL 8.0
- **缓存**: Redis 6.x
- **消息队列**: RabbitMQ 3.9.x

### 基础设施
- **反向代理**: Nginx 1.20.x
- **监控**: Prometheus + Grafana
- **日志**: Winston + ELK Stack
- **CI/CD**: Jenkins
- **容器化**: Docker + Docker Compose

## 🚀 快速开始

### 环境要求

- Node.js >= 16.x
- MySQL >= 8.0
- Redis >= 6.x
- Docker & Docker Compose (可选)

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/Aeglx/WeDraw.git
cd WeDraw
```

2. **安装依赖**
```bash
# 安装根目录依赖
npm install

# 安装各服务依赖
npm run install:all
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
vim .env
```

4. **初始化数据库**
```bash
# 创建数据库
npm run db:create

# 运行迁移
npm run db:migrate

# 填充测试数据
npm run db:seed
```

5. **启动服务**
```bash
# 启动所有后端服务
npm run dev:backend

# 启动前端应用
npm run dev:frontend
```

### Docker 部署

1. **使用 Docker Compose 一键启动**
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

2. **访问应用**
- 管理后台: http://localhost:8080
- API文档: http://localhost:3000/docs
- 积分商城: http://localhost:8081

## 📋 环境配置

### 必需的环境变量

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=

# JWT配置
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# 微信配置
WECHAT_APP_ID=your-app-id
WECHAT_APP_SECRET=your-app-secret

# 企业微信配置
WECOM_CORP_ID=your-corp-id
WECOM_CORP_SECRET=your-corp-secret
```

## 📚 API 文档

项目集成了 Swagger 自动生成 API 文档，启动服务后可访问：

- **API 文档**: http://localhost:3000/docs
- **接口测试**: http://localhost:3000/api-test

### 主要接口

- **用户认证**: `/api/auth/*`
- **公众号管理**: `/api/wechat/*`
- **企业微信**: `/api/wecom/*`
- **小程序**: `/api/miniprogram/*`
- **积分商城**: `/api/points/*`
- **消息中心**: `/api/message/*`
- **数据分析**: `/api/analytics/*`

## 🔧 开发指南

### 代码规范

- 使用 ESLint + Prettier 进行代码格式化
- 遵循 RESTful API 设计规范
- 使用 Git Flow 工作流
- 提交信息遵循 Conventional Commits 规范

### 测试

```bash
# 运行单元测试
npm run test

# 运行集成测试
npm run test:integration

# 生成测试覆盖率报告
npm run test:coverage
```

### 数据库迁移

```bash
# 创建新的迁移文件
npm run migration:create -- --name create-users-table

# 运行迁移
npm run migration:up

# 回滚迁移
npm run migration:down
```

## 🚀 生产环境部署

### 服务启动与监控

#### 配置 Supervisor 管理服务进程

创建配置文件 `/etc/supervisor/conf.d/official-account.conf`：

```ini
[program:official-account]
command=/root/.nvm/versions/node/v16.18.0/bin/node /opt/services/official-account/server.js
directory=/opt/services/official-account
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/official-account.log
```

#### 启动服务并设置开机自启

```bash
supervisorctl reread
supervisorctl update
supervisorctl start official-account
```

#### 服务验证

- 访问 `http://{服务IP}:{端口}/health`，返回 `{"status":"ok"}` 表示启动成功
- 检查日志文件 `/var/log/official-account.log`，确认无报错

### 数据库与缓存部署

#### MySQL 部署

- 按服务创建独立数据库（如 `official_account_db`、`wecom_db`），并分配独立账号（仅授予对应库的权限）
- 配置主从复制：主库负责写入，从库负责查询
- 通过 `mysqldump` 定期备份数据（每日凌晨执行）

#### Redis 部署

- 为每个服务创建独立 Redis 实例（通过不同端口区分）
  - 6380 = 公众号服务
  - 6381 = 企业微信服务
- 配置 `redis.conf`：开启密码认证、AOF 持久化，限制最大内存（如 2GB）

### 服务访问流程配置

通过 Nginx 实现 API 网关的反向代理，统一入口为 `api.example.com`：

```nginx
server {
  listen 80;
  server_name api.example.com;
  
  # 公众号服务路由
  location /api/official-account/ {
    proxy_pass http://official-account-service:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
  
  # 企业微信服务路由
  location /api/wecom/ {
    proxy_pass http://wecom-service:3002/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
  
  # 其他服务路由
  location /api/miniprogram/ { ... }
  location /api/points/ { ... }
}
```

### 监控与运维

#### 服务监控

- 使用 Prometheus 采集各服务 metrics（通过 `express-prometheus-middleware` 暴露指标）
- Grafana 配置仪表盘，监控服务响应时间、错误率、CPU/内存使用率
- 设置阈值告警（邮件/企业微信通知）

#### 日志管理

- 所有服务日志统一输出至 `/var/log/{服务名}` 目录，按日期切割（通过 logrotate 配置）
- Logstash 收集日志至 Elasticsearch，通过 Kibana 查询与分析
- 支持按服务、级别、时间筛选

#### 备份策略

- **MySQL**：每日凌晨全量备份（保留 30 天），每小时增量备份（保留 7 天）
- **配置文件**：通过 Git 管理所有服务的配置文件，确保可追溯

## 🔒 安全设计

### 接口安全

- 所有 API 通过 HTTPS 传输（配置 SSL 证书）
- 敏感接口（如登录、支付）额外验证签名
- 实现接口限流：单 IP 每分钟最多 60 次请求，防止恶意攻击

### 数据安全

- 数据库敏感字段（如密码）加密存储
- API 返回数据过滤敏感信息（如手机号脱敏）
- 定期安全审计：检查权限配置、日志异常操作、第三方接口密钥有效期

### 访问控制

- 管理后台仅限企业内网访问，通过 VPN 开放外部临时访问权限
- 基于 RBAC 模型严格控制操作权限（如"只读角色"无法修改配置）


## 🤝 贡献指南

我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复

### 提交流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 📞 联系我们

- **项目维护者**: [Your Name](mailto:your.email@example.com)
- **问题反馈**: [GitHub Issues](https://github.com/Aeglx/WeDraw/issues)
- **技术交流**: [微信群二维码]

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者们！



## 📚 附录

### 接口文档

通过 Swagger 自动生成，访问 `http://api.example.com/docs` 查看完整接口文档。

### 数据库字典

各服务数据库表结构详情（字段含义、类型、约束），详见各服务目录下的 `docs/database.md` 文件。

### 常见问题

#### 部署失败排查

- 检查端口是否被占用
- 确认数据库连接配置是否正确
- 查看服务日志文件排查具体错误

#### 服务异常处理

- 重启服务：`supervisorctl restart service-name`
- 查看服务状态：`supervisorctl status`
- 检查系统资源使用情况：`top`、`free -h`

#### 第三方接口对接问题

- 确认 AppID 和 AppSecret 配置正确
- 检查回调地址是否可访问
- 验证签名算法是否正确

---

⭐ 如果这个项目对你有帮助，请给我们一个 Star！
