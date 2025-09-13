# WeDraw 小程序服务

## 项目简介

WeDraw 小程序服务是一个基于 Node.js 和 Express 框架的后端服务，专门为微信小程序提供用户管理和消息推送功能。

## 功能特性

### 用户管理
- 微信小程序登录认证
- 用户信息管理
- 会话管理
- 用户状态跟踪
- 管理员权限控制

### 消息推送
- 文本消息发送
- 模板消息推送
- 批量消息发送
- 消息状态跟踪
- 消息重试机制

### 安全特性
- JWT 令牌认证
- 请求速率限制
- 输入参数验证
- 数据加密存储
- 安全日志记录

### 系统特性
- 全局错误处理
- 请求日志记录
- 健康检查
- 优雅关闭
- API 文档（Swagger）

## 技术栈

- **运行环境**: Node.js 16+
- **Web 框架**: Express.js
- **数据库**: MySQL + Sequelize ORM
- **缓存**: Redis
- **认证**: JWT
- **文档**: Swagger/OpenAPI
- **测试**: Jest
- **代码质量**: ESLint + Prettier
- **进程管理**: PM2

## 项目结构

```
miniprogram-service/
├── src/                    # 源代码目录
│   ├── controllers/        # 控制器
│   │   ├── UserController.js
│   │   └── MessageController.js
│   ├── services/          # 业务逻辑服务
│   │   ├── UserService.js
│   │   ├── MessageService.js
│   │   └── WeChatService.js
│   ├── models/            # 数据模型
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── Session.js
│   ├── middleware/        # 中间件
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   ├── validator.js
│   │   ├── errorHandler.js
│   │   └── logger.js
│   ├── routes/            # 路由定义
│   │   ├── users.js
│   │   ├── messages.js
│   │   └── index.js
│   ├── utils/             # 工具函数
│   │   ├── logger.js
│   │   ├── errors.js
│   │   ├── crypto.js
│   │   └── gracefulShutdown.js
│   ├── config/            # 配置文件
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── swagger.js
│   └── app.js             # 应用入口
├── tests/                 # 测试文件
│   ├── controllers/
│   ├── middleware/
│   └── setup.js
├── docs/                  # 文档
├── logs/                  # 日志文件
├── package.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc.js
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 5.7
- Redis >= 6.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 环境配置

复制环境变量模板文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下环境变量：

```env
# 应用配置
NODE_ENV=development
PORT=3001
APP_NAME=WeDraw Miniprogram Service

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wedraw_miniprogram
DB_USER=root
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 数据库初始化

```bash
# 创建数据库
npm run db:create

# 运行迁移
npm run db:migrate

# 运行种子数据（可选）
npm run db:seed
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 使用 PM2 启动
npm run pm2:start
```

## 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码规范检查：

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范问题
npm run lint:fix

# 格式化代码
npm run format
```

### 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监视模式运行测试
npm run test:watch
```

### API 文档

启动服务后，可以通过以下地址访问 API 文档：

- Swagger UI: http://localhost:3001/api-docs
- JSON 格式: http://localhost:3001/api-docs.json

## API 接口

### 用户相关接口

- `POST /api/users/login` - 微信小程序登录
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息
- `POST /api/users/logout` - 用户登出
- `DELETE /api/users/session` - 销毁会话
- `POST /api/users/refresh` - 刷新会话
- `GET /api/users/stats` - 获取用户统计（管理员）

### 消息相关接口

- `POST /api/messages/send` - 发送文本消息
- `POST /api/messages/template` - 发送模板消息
- `POST /api/messages/batch` - 批量发送消息
- `GET /api/messages` - 获取消息列表
- `GET /api/messages/:id` - 获取消息详情
- `POST /api/messages/:id/retry` - 重试发送消息
- `DELETE /api/messages/:id` - 撤回消息
- `GET /api/messages/stats` - 获取消息统计

### 系统接口

- `GET /health` - 健康检查
- `GET /ready` - 就绪检查
- `GET /metrics` - 系统指标

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t wedraw-miniprogram-service .

# 运行容器
docker run -d \
  --name wedraw-miniprogram \
  -p 3001:3001 \
  -e NODE_ENV=production \
  wedraw-miniprogram-service
```

### PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
npm run pm2:start

# 查看状态
pm2 status

# 查看日志
pm2 logs wedraw-miniprogram

# 重启服务
pm2 restart wedraw-miniprogram

# 停止服务
pm2 stop wedraw-miniprogram
```

## 监控和日志

### 日志文件

- 应用日志: `logs/app.log`
- 错误日志: `logs/error.log`
- 访问日志: `logs/access.log`

### 监控指标

- 请求响应时间
- 错误率统计
- 内存使用情况
- CPU 使用率
- 数据库连接状态
- Redis 连接状态

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证数据库连接配置
   - 确认数据库用户权限

2. **Redis 连接失败**
   - 检查 Redis 服务状态
   - 验证 Redis 连接配置
   - 检查网络连接

3. **微信 API 调用失败**
   - 验证 AppID 和 Secret
   - 检查网络连接
   - 查看微信开发者工具日志

4. **JWT 令牌验证失败**
   - 检查 JWT_SECRET 配置
   - 验证令牌是否过期
   - 确认请求头格式正确

### 调试模式

```bash
# 启用调试日志
DEBUG=* npm run dev

# 启用特定模块调试
DEBUG=app:* npm run dev
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目维护者: WeDraw Team
- 邮箱: support@wedraw.com
- 项目地址: https://github.com/wedraw/miniprogram-service

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史。