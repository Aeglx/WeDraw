# WeDraw 用户中心服务

用户中心服务是WeDraw平台的核心服务之一，负责统一身份认证、权限管理、用户信息管理等功能。

## 功能特性

### 🔐 身份认证
- 用户注册/登录
- JWT令牌管理
- 双因子认证(2FA)
- 社交登录集成
- 密码重置

### 👤 用户管理
- 用户信息管理
- 头像上传
- 个人资料设置
- 账户安全设置
- 隐私设置

### 🛡️ 权限控制
- 基于角色的访问控制(RBAC)
- 细粒度权限管理
- 资源访问控制
- API权限验证

### 📧 通知服务
- 邮件通知
- 短信验证
- 系统消息
- 通知偏好设置

### 📊 管理功能
- 用户管理后台
- 系统统计
- 操作日志
- 安全审计

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.0
- **ORM**: Sequelize
- **认证**: JWT
- **验证**: Joi
- **日志**: Winston
- **文档**: Swagger

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境配置文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置数据库、Redis等连接信息

### 数据库初始化

1. 创建数据库：
```bash
npm run db:create
```

2. 运行迁移：
```bash
npm run migrate
```

3. 填充种子数据：
```bash
npm run seed
```

### 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API 文档

服务启动后，访问 `http://localhost:3001/api-docs` 查看完整的API文档。

### 主要端点

#### 认证相关
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - 刷新令牌
- `POST /api/v1/auth/forgot-password` - 忘记密码
- `POST /api/v1/auth/reset-password` - 重置密码

#### 用户管理
- `GET /api/v1/users/profile` - 获取个人信息
- `PUT /api/v1/users/profile` - 更新个人信息
- `POST /api/v1/users/avatar` - 上传头像
- `PUT /api/v1/users/password` - 修改密码
- `GET /api/v1/users/search` - 搜索用户

#### 管理员功能
- `GET /api/v1/admin/users` - 获取用户列表
- `POST /api/v1/admin/users` - 创建用户
- `PUT /api/v1/admin/users/:id` - 更新用户
- `DELETE /api/v1/admin/users/:id` - 删除用户
- `GET /api/v1/admin/stats` - 获取统计信息

## 部署

### Docker 部署

1. 构建镜像：
```bash
docker build -t wedraw-user-center .
```

2. 使用 Docker Compose：
```bash
docker-compose up -d
```

### 生产环境部署

1. 设置环境变量
2. 安装依赖：`npm ci --only=production`
3. 运行数据库迁移：`npm run migrate`
4. 启动服务：`npm start`

## 开发指南

### 项目结构

```
src/
├── config/          # 配置文件
│   ├── database.js   # 数据库配置
│   └── redis.js      # Redis配置
├── controllers/      # 控制器
├── middleware/       # 中间件
├── models/          # 数据模型
├── routes/          # 路由定义
├── services/        # 业务服务
├── utils/           # 工具函数
├── migrations/      # 数据库迁移
└── seeders/         # 种子数据
```

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 Airbnb JavaScript 规范
- 使用 Prettier 格式化代码

### 测试

运行测试：
```bash
npm test
```

生成覆盖率报告：
```bash
npm run test:coverage
```

### 日志

日志文件位于 `logs/` 目录：
- `error.log` - 错误日志
- `combined.log` - 综合日志
- `access.log` - 访问日志

## 监控和维护

### 健康检查

访问 `GET /health` 端点检查服务状态。

### 性能监控

- 使用 Winston 记录详细日志
- Redis 缓存性能监控
- 数据库连接池监控

### 安全措施

- 密码加密存储
- JWT令牌安全
- 请求限流
- SQL注入防护
- XSS防护
- CSRF防护

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证连接配置
   - 检查网络连接

2. **Redis连接失败**
   - 检查Redis服务状态
   - 验证连接参数
   - 检查防火墙设置

3. **JWT令牌验证失败**
   - 检查密钥配置
   - 验证令牌格式
   - 检查令牌过期时间

### 日志分析

使用以下命令查看日志：
```bash
# 查看错误日志
tail -f logs/error.log

# 查看访问日志
tail -f logs/access.log

# 搜索特定错误
grep "ERROR" logs/combined.log
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

- 项目地址: https://github.com/wedraw/backend
- 问题反馈: https://github.com/wedraw/backend/issues
- 邮箱: dev@wedraw.com