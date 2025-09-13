# WeDraw积分商城后端服务

## 项目简介

WeDraw积分商城是一个基于Node.js和Express框架开发的积分商城后端服务，提供完整的积分管理、商品管理、订单处理、用户管理等功能。

## 主要功能

### 🎯 核心功能
- **用户管理** - 用户注册、登录、信息管理
- **积分系统** - 积分获取、消费、转账、统计
- **商品管理** - 商品展示、分类、库存管理
- **订单处理** - 下单、支付、发货、退款
- **优惠券系统** - 优惠券发放、使用、管理
- **支付集成** - 支付宝、微信支付

### 🔧 技术特性
- **RESTful API** - 标准化API接口
- **JWT认证** - 安全的用户认证
- **Redis缓存** - 高性能数据缓存
- **文件上传** - 图片和文档上传
- **限流保护** - API请求频率限制
- **日志记录** - 完整的操作日志
- **错误处理** - 统一的错误处理机制

## 技术栈

- **运行环境**: Node.js 18+
- **Web框架**: Express.js
- **数据库**: PostgreSQL
- **缓存**: Redis
- **ORM**: Sequelize
- **认证**: JWT
- **文档**: Swagger
- **测试**: Jest
- **代码规范**: ESLint + Prettier

## 项目结构

```
points-mall/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   ├── services/        # 业务服务
│   ├── utils/           # 工具函数
│   └── app.js          # 应用入口
├── tests/              # 测试文件
├── uploads/            # 上传文件
├── logs/               # 日志文件
├── docs/               # 文档
├── .env.example        # 环境变量模板
├── package.json        # 项目配置
├── server.js           # 服务器启动文件
└── README.md           # 项目说明
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 12.0
- Redis >= 6.0
- npm >= 8.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/wedraw/points-mall-backend.git
cd points-mall-backend
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和Redis连接信息
```

4. **数据库初始化**
```bash
# 创建数据库
createdb points_mall

# 运行数据库迁移
npm run db:migrate

# 运行种子数据（可选）
npm run db:seed
```

5. **启动服务**
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

6. **访问服务**
- API服务: http://localhost:3000
- API文档: http://localhost:3000/api-docs
- 健康检查: http://localhost:3000/health

## 环境配置

### 必需配置

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=points_mall
DB_USER=postgres
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT密钥
JWT_SECRET=your_jwt_secret_key
```

### 可选配置

详细配置选项请参考 `.env.example` 文件。

## API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/refresh` - 刷新令牌
- `POST /api/auth/logout` - 用户登出

### 用户接口
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息
- `GET /api/users/points` - 获取用户积分
- `GET /api/users/orders` - 获取用户订单

### 积分接口
- `GET /api/points/account` - 获取积分账户
- `GET /api/points/transactions` - 获取积分交易记录
- `POST /api/points/transfer` - 积分转账
- `GET /api/points/statistics` - 积分统计

### 商品接口
- `GET /api/products` - 获取商品列表
- `GET /api/products/:id` - 获取商品详情
- `GET /api/products/search` - 搜索商品
- `GET /api/products/categories` - 获取商品分类

### 订单接口
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `PUT /api/orders/:id/pay` - 支付订单
- `PUT /api/orders/:id/cancel` - 取消订单

### 优惠券接口
- `GET /api/coupons` - 获取可用优惠券
- `POST /api/coupons/:id/claim` - 领取优惠券
- `GET /api/coupons/my` - 获取我的优惠券
- `POST /api/coupons/validate` - 验证优惠券

完整的API文档请访问: http://localhost:3000/api-docs

## 开发指南

### 代码规范

项目使用ESLint和Prettier进行代码规范检查：

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范
npm run lint:fix

# 格式化代码
npm run format
```

### 测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

### 数据库操作

```bash
# 创建迁移文件
npm run db:migration:create -- --name create-users-table

# 运行迁移
npm run db:migrate

# 回滚迁移
npm run db:migrate:undo

# 创建种子文件
npm run db:seed:create -- --name demo-users

# 运行种子
npm run db:seed

# 回滚种子
npm run db:seed:undo
```

## 部署

### Docker部署

1. **构建镜像**
```bash
npm run docker:build
```

2. **运行容器**
```bash
npm run docker:run
```

### PM2部署

1. **安装PM2**
```bash
npm install -g pm2
```

2. **启动服务**
```bash
npm run pm2:start
```

3. **管理服务**
```bash
# 查看状态
pm2 status

# 查看日志
npm run pm2:logs

# 重启服务
npm run pm2:restart

# 停止服务
npm run pm2:stop
```

### 生产环境配置

1. **环境变量**
```env
NODE_ENV=production
PORT=3000
DB_LOGGING=false
LOG_LEVEL=warn
```

2. **性能优化**
- 启用集群模式
- 配置负载均衡
- 启用缓存
- 优化数据库连接池

3. **安全配置**
- 使用HTTPS
- 配置防火墙
- 启用安全头
- 定期更新依赖

## 监控和日志

### 日志配置

日志文件位于 `logs/` 目录：
- `application.log` - 应用日志
- `error.log` - 错误日志
- `access.log` - 访问日志

### 健康检查

- **健康检查**: `GET /health`
- **就绪检查**: `GET /ready`

### 性能监控

建议集成以下监控工具：
- **APM**: New Relic, DataDog
- **日志**: ELK Stack, Fluentd
- **指标**: Prometheus + Grafana

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证连接配置
   - 检查网络连接

2. **Redis连接失败**
   - 检查Redis服务状态
   - 验证Redis配置
   - 检查防火墙设置

3. **JWT令牌错误**
   - 检查JWT密钥配置
   - 验证令牌格式
   - 检查令牌过期时间

4. **文件上传失败**
   - 检查上传目录权限
   - 验证文件大小限制
   - 检查文件类型限制

### 调试模式

```bash
# 启用调试模式
DEBUG=points-mall:* npm run dev

# 启用性能分析
PROFILE_ENABLED=true npm run dev
```

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

### 提交规范

使用约定式提交格式：

```
type(scope): description

[optional body]

[optional footer]
```

类型说明：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 联系我们

- **项目主页**: https://github.com/wedraw/points-mall-backend
- **问题反馈**: https://github.com/wedraw/points-mall-backend/issues
- **邮箱**: support@wedraw.com
- **官网**: https://wedraw.com

## 更新日志

### v1.0.0 (2024-01-01)
- 🎉 初始版本发布
- ✨ 完整的积分商城功能
- 🔐 JWT认证系统
- 💳 支付系统集成
- 📝 完整的API文档
- 🧪 单元测试覆盖
- 🐳 Docker支持
- 📊 监控和日志系统

---

**感谢使用WeDraw积分商城！** 🎉