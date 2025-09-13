# WeDraw 微信公众号服务

微信公众号后端服务，提供粉丝管理、消息推送、自定义菜单等功能。

## 功能特性

- 🔐 **安全认证**: JWT令牌认证，支持权限控制
- 👥 **粉丝管理**: 粉丝信息管理、标签分组、黑名单管理
- 💬 **消息处理**: 智能消息回复、群发消息、模板消息
- 🎯 **自定义菜单**: 菜单创建、更新、删除
- 📊 **数据统计**: 粉丝统计、消息统计、互动分析
- 🚀 **高性能**: Redis缓存、连接池、限流保护
- 📝 **完整日志**: 结构化日志记录、错误追踪
- 🐳 **容器化**: Docker支持，一键部署

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: PostgreSQL + Sequelize ORM
- **缓存**: Redis + ioredis
- **认证**: JWT + bcrypt
- **验证**: express-validator
- **日志**: Winston
- **文档**: Swagger/OpenAPI
- **容器**: Docker + Docker Compose

## 快速开始

### 环境要求

- Node.js 18.0+
- PostgreSQL 12+
- Redis 6+
- Docker & Docker Compose (可选)

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd wechat-official
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库、Redis、微信等参数
```

4. **数据库初始化**
```bash
npm run db:migrate
npm run db:seed
```

5. **启动服务**
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### Docker部署

1. **构建并启动服务**
```bash
docker-compose up -d
```

2. **查看服务状态**
```bash
docker-compose ps
docker-compose logs -f wechat-official
```

3. **停止服务**
```bash
docker-compose down
```

## 环境变量配置

### 基础配置
```env
# 应用配置
NODE_ENV=development
PORT=3000
APP_NAME=WeDraw微信公众号服务

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wedraw_wechat
DB_USER=wedraw_user
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_ISSUER=wedraw-wechat
```

### 微信配置
```env
# 微信公众号配置
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
WECHAT_TOKEN=your_token
WECHAT_ENCODING_AES_KEY=your_encoding_aes_key
WECHAT_API_BASE_URL=https://api.weixin.qq.com
```

## API文档

启动服务后，访问以下地址查看API文档：

- **Swagger UI**: http://localhost:3000/api-docs
- **健康检查**: http://localhost:3000/health

### 主要API端点

#### 微信服务
- `GET /api/wechat` - 微信服务器验证
- `POST /api/wechat` - 处理微信消息推送
- `GET /api/wechat/user/:openid` - 获取用户信息
- `POST /api/wechat/menu` - 创建自定义菜单

#### 粉丝管理
- `GET /api/fans` - 获取粉丝列表
- `POST /api/fans` - 添加粉丝
- `PUT /api/fans/:id` - 更新粉丝信息
- `DELETE /api/fans/:id` - 删除粉丝

#### 消息管理
- `GET /api/messages` - 获取消息列表
- `POST /api/messages/send` - 发送消息
- `POST /api/messages/broadcast` - 群发消息
- `GET /api/messages/stats` - 消息统计

## 项目结构

```
wechat-official/
├── src/
│   ├── app.js              # 应用入口
│   ├── config/             # 配置文件
│   │   └── index.js
│   ├── controllers/        # 控制器
│   │   └── wechatController.js
│   ├── middleware/         # 中间件
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── rateLimiter.js
│   ├── models/             # 数据模型
│   │   ├── index.js
│   │   ├── Fan.js
│   │   └── Message.js
│   ├── routes/             # 路由
│   │   ├── fans.js
│   │   ├── message.js
│   │   └── wechat.js
│   ├── services/           # 业务服务
│   │   ├── wechatService.js
│   │   ├── messageService.js
│   │   └── cacheService.js
│   └── utils/              # 工具函数
│       ├── logger.js
│       └── gracefulShutdown.js
├── logs/                   # 日志文件
├── uploads/                # 上传文件
├── temp/                   # 临时文件
├── tests/                  # 测试文件
├── docker-compose.yml      # Docker编排
├── Dockerfile             # Docker镜像
├── package.json           # 项目配置
└── README.md              # 项目文档
```

## 开发指南

### 代码规范

项目使用ESLint和Prettier进行代码规范检查：

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 修复可修复的问题
npm run lint:fix
```

### 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

### 数据库操作

```bash
# 创建迁移文件
npm run db:migration:create -- --name create-fans-table

# 运行迁移
npm run db:migrate

# 回滚迁移
npm run db:migrate:undo

# 创建种子文件
npm run db:seed:create -- --name demo-fans

# 运行种子
npm run db:seed
```

## 部署指南

### 生产环境部署

1. **服务器准备**
   - 安装Docker和Docker Compose
   - 配置防火墙规则
   - 准备SSL证书（HTTPS）

2. **环境配置**
   ```bash
   # 复制生产环境配置
   cp .env.production .env
   # 编辑配置文件
   vim .env
   ```

3. **启动服务**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **配置反向代理**
   - 使用Nginx或Traefik配置HTTPS
   - 设置负载均衡（如需要）

### 监控和日志

- **应用日志**: 查看 `logs/` 目录下的日志文件
- **容器日志**: `docker-compose logs -f wechat-official`
- **健康检查**: 访问 `/health` 端点
- **性能监控**: 可集成Prometheus + Grafana

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证连接参数是否正确
   - 确认网络连通性

2. **Redis连接失败**
   - 检查Redis服务状态
   - 验证密码配置
   - 检查防火墙设置

3. **微信API调用失败**
   - 验证AppID和AppSecret
   - 检查服务器IP白名单
   - 确认网络访问权限

4. **内存使用过高**
   - 检查日志文件大小
   - 监控数据库连接池
   - 优化缓存策略

### 日志分析

```bash
# 查看错误日志
tail -f logs/error.log

# 查看访问日志
tail -f logs/access.log

# 搜索特定错误
grep "ERROR" logs/app.log
```

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目维护者: WeDraw Team
- 邮箱: support@wedraw.com
- 问题反馈: [GitHub Issues](https://github.com/wedraw/wechat-official/issues)