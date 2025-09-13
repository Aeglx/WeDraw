# 企业微信服务 (WeWork Service)

企业微信集成服务，提供通讯录管理、群聊管理、机器人管理等功能。

## 功能特性

### 🏢 通讯录管理
- 联系人信息管理（增删改查）
- 部门结构管理
- 批量导入联系人
- 与企业微信通讯录同步
- 联系人搜索和筛选

### 💬 群聊管理
- 群组信息管理
- 群成员管理
- 群消息记录
- 群组权限控制

### 🤖 机器人管理
- Webhook机器人配置
- 消息发送和接收
- 机器人权限管理
- 消息模板管理

### 📊 统计分析
- 消息统计
- 活跃度分析
- 使用情况报告

## 技术栈

- **运行环境**: Node.js 16+
- **Web框架**: Express.js
- **数据库**: MySQL 8.0+
- **ORM**: Sequelize
- **缓存**: Redis
- **实时通信**: Socket.IO
- **认证**: JWT
- **测试**: Jest
- **文档**: Swagger/OpenAPI

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境配置文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置以下信息：

```env
# 服务配置
PORT=3003
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wework_service
DB_USER=root
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# 企业微信配置
WEWORK_CORP_ID=your_corp_id
WEWORK_CORP_SECRET=your_corp_secret
WEWORK_AGENT_ID=your_agent_id
```

### 数据库初始化

```bash
# 创建数据库
npm run db:create

# 运行迁移
npm run db:migrate

# 填充种子数据（可选）
npm run db:seed
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3003` 启动。

## API 文档

启动服务后，访问 `http://localhost:3003/api-docs` 查看完整的API文档。

### 主要接口

#### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌

#### 通讯录
- `GET /api/contacts` - 获取联系人列表
- `GET /api/contacts/:id` - 获取联系人详情
- `POST /api/contacts` - 创建联系人
- `PUT /api/contacts/:id` - 更新联系人
- `DELETE /api/contacts/:id` - 删除联系人
- `POST /api/contacts/batch` - 批量导入联系人
- `POST /api/contacts/sync` - 同步企业微信通讯录

#### 群组
- `GET /api/groups` - 获取群组列表
- `GET /api/groups/:id` - 获取群组详情
- `POST /api/groups` - 创建群组
- `PUT /api/groups/:id` - 更新群组
- `DELETE /api/groups/:id` - 删除群组
- `POST /api/groups/:id/members` - 添加群成员
- `DELETE /api/groups/:id/members/:userId` - 移除群成员

#### 机器人
- `GET /api/bots` - 获取机器人列表
- `GET /api/bots/:id` - 获取机器人详情
- `POST /api/bots` - 创建机器人
- `PUT /api/bots/:id` - 更新机器人
- `DELETE /api/bots/:id` - 删除机器人
- `POST /api/bots/:id/send` - 发送消息

## 开发指南

### 项目结构

```
wework-service/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   └── utils/           # 工具类
├── tests/               # 测试文件
├── docs/                # 文档
├── package.json
├── server.js            # 入口文件
└── README.md
```

### 代码规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 RESTful API 设计原则
- 编写单元测试和集成测试

### 运行测试

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
# 创建新的迁移文件
npm run migration:create -- --name create-new-table

# 运行迁移
npm run db:migrate

# 回滚迁移
npm run db:migrate:undo

# 创建种子文件
npm run seed:create -- --name demo-data

# 运行种子
npm run db:seed:all
```

## 部署

### Docker 部署

1. 构建镜像：
```bash
docker build -t wework-service .
```

2. 运行容器：
```bash
docker run -d \
  --name wework-service \
  -p 3003:3003 \
  -e DB_HOST=your_db_host \
  -e REDIS_HOST=your_redis_host \
  wework-service
```

### PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs wework-service
```

## 监控和日志

### 健康检查

- `GET /api/health` - 服务健康状态
- `GET /api/health/db` - 数据库连接状态
- `GET /api/health/redis` - Redis连接状态

### 日志

日志文件位置：
- 应用日志：`logs/app.log`
- 错误日志：`logs/error.log`
- 访问日志：`logs/access.log`

### 性能监控

- 使用 `express-status-monitor` 监控服务性能
- 访问 `/status` 查看实时监控面板

## 安全

### 认证和授权

- JWT Token 认证
- API Key 认证（用于服务间调用）
- 基于角色的权限控制

### 安全措施

- HTTPS 强制
- CORS 配置
- 请求速率限制
- SQL 注入防护
- XSS 防护
- CSRF 防护

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证连接配置是否正确
   - 确认网络连通性

2. **Redis连接失败**
   - 检查Redis服务是否启动
   - 验证Redis配置
   - 检查防火墙设置

3. **企业微信API调用失败**
   - 验证企业微信配置
   - 检查网络连接
   - 确认API权限

### 调试模式

```bash
# 启用调试日志
DEBUG=wework:* npm run dev

# 启用详细日志
LOG_LEVEL=debug npm run dev
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目维护者：WeDraw Team
- 邮箱：support@wedraw.com
- 问题反馈：[GitHub Issues](https://github.com/wedraw/wework-service/issues)

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 基础通讯录管理功能
- 群组管理功能
- 机器人管理功能
- API文档和测试

---

**注意**: 请确保在生产环境中使用强密码和安全配置。