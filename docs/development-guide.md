# WeDraw 开发指南

## 目录

- [开发环境搭建](#开发环境搭建)
- [项目结构](#项目结构)
- [开发规范](#开发规范)
- [API设计规范](#api设计规范)
- [数据库规范](#数据库规范)
- [测试规范](#测试规范)
- [部署流程](#部署流程)
- [常见问题](#常见问题)

## 开发环境搭建

### 系统要求

- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **MySQL**: >= 8.0
- **Redis**: >= 6.0
- **Git**: >= 2.20.0

### 开发工具推荐

- **IDE**: Visual Studio Code, WebStorm
- **数据库工具**: MySQL Workbench, Navicat, DBeaver
- **API测试**: Postman, Insomnia
- **版本控制**: Git + GitHub/GitLab
- **容器化**: Docker Desktop

### 环境配置步骤

1. **安装 Node.js**
```bash
# 使用 nvm 管理 Node.js 版本（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

2. **安装全局依赖**
```bash
npm install -g pm2 nodemon eslint
```

3. **克隆项目**
```bash
git clone <repository-url>
cd WeDraw
```

4. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入开发环境配置
```

5. **安装项目依赖**
```bash
# 使用脚本批量安装
./scripts/install-deps.sh

# 或手动安装各服务依赖
cd backend/api-gateway && npm install
cd ../user-center && npm install
# ... 其他服务
```

6. **初始化数据库**
```bash
# 创建数据库
mysql -u root -p < database/migrations/001_init_databases.sql

# 创建表结构
for file in database/migrations/*.sql; do
    mysql -u root -p < "$file"
done

# 插入初始数据
mysql -u root -p < database/seeds/001_init_data.sql
```

## 项目结构

```
WeDraw/
├── backend/                    # 后端服务
│   ├── api-gateway/           # API网关
│   ├── user-center/           # 用户中心
│   ├── official/              # 公众号服务
│   ├── wecom/                 # 企业微信服务
│   ├── miniprogram/           # 小程序服务
│   ├── points/                # 积分商城
│   ├── message/               # 消息中心
│   ├── analysis/              # 数据分析
│   └── shared/                # 共享模块
├── database/                   # 数据库相关
│   ├── migrations/            # 数据库迁移
│   ├── seeds/                 # 初始数据
│   └── schemas/               # 数据库设计文档
├── docs/                      # 项目文档
├── nginx/                     # Nginx配置
├── scripts/                   # 部署脚本
├── logs/                      # 日志文件
├── uploads/                   # 上传文件
├── docker-compose.yml         # Docker编排
├── ecosystem.config.js        # PM2配置
└── .env.example              # 环境变量示例
```

### 微服务结构

每个微服务遵循统一的目录结构：

```
service-name/
├── controllers/               # 控制器
├── models/                    # 数据模型
├── routes/                    # 路由定义
├── middleware/                # 中间件
├── services/                  # 业务逻辑
├── utils/                     # 工具函数
├── config/                    # 配置文件
├── tests/                     # 测试文件
├── server.js                  # 服务入口
├── package.json              # 依赖配置
└── Dockerfile                # Docker配置
```

## 开发规范

### 代码风格

使用 ESLint + Prettier 统一代码风格：

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error'
  }
}
```

### 命名规范

- **文件名**: 使用 kebab-case (user-controller.js)
- **变量名**: 使用 camelCase (userName)
- **常量名**: 使用 UPPER_SNAKE_CASE (MAX_RETRY_COUNT)
- **类名**: 使用 PascalCase (UserService)
- **数据库表名**: 使用 snake_case (user_profiles)
- **API路径**: 使用 kebab-case (/api/user-profiles)

### 注释规范

```javascript
/**
 * 用户服务类
 * @class UserService
 */
class UserService {
  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.email - 邮箱
   * @returns {Promise<Object>} 创建的用户对象
   * @throws {ValidationError} 当用户数据无效时
   */
  async createUser(userData) {
    // 实现逻辑
  }
}
```

### Git 提交规范

使用 Conventional Commits 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型说明**:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例**:
```
feat(user): add user registration API

fix(auth): resolve JWT token expiration issue

docs: update API documentation
```

## API设计规范

### RESTful API 设计

```
GET    /api/users          # 获取用户列表
GET    /api/users/:id      # 获取单个用户
POST   /api/users          # 创建用户
PUT    /api/users/:id      # 更新用户
DELETE /api/users/:id      # 删除用户
```

### 响应格式

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  },
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "用户名已存在",
    "details": {
      "field": "username",
      "value": "john_doe"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### HTTP 状态码

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权
- `403 Forbidden`: 禁止访问
- `404 Not Found`: 资源不存在
- `422 Unprocessable Entity`: 数据验证失败
- `500 Internal Server Error`: 服务器内部错误

## 数据库规范

### 表设计规范

1. **表名**: 使用复数形式，snake_case 命名
2. **主键**: 统一使用 `id` 作为主键，类型为 `BIGINT UNSIGNED AUTO_INCREMENT`
3. **时间戳**: 每个表都应包含 `created_at` 和 `updated_at` 字段
4. **软删除**: 使用 `deleted_at` 字段实现软删除
5. **字符集**: 统一使用 `utf8mb4` 字符集

### 字段命名规范

```sql
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` TIMESTAMP NULL COMMENT '删除时间',
  
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

### 索引设计

1. **主键索引**: 自动创建
2. **唯一索引**: 用于唯一约束字段
3. **普通索引**: 用于频繁查询的字段
4. **复合索引**: 用于多字段组合查询
5. **前缀索引**: 用于长字符串字段

## 测试规范

### 测试分类

1. **单元测试**: 测试单个函数或方法
2. **集成测试**: 测试模块间的交互
3. **端到端测试**: 测试完整的业务流程

### 测试框架

使用 Jest 作为测试框架：

```javascript
// tests/user.test.js
const request = require('supertest')
const app = require('../server')

describe('User API', () => {
  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }
      
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201)
      
      expect(response.body.success).toBe(true)
      expect(response.body.data.username).toBe(userData.username)
    })
  })
})
```

### 测试覆盖率

- 单元测试覆盖率 >= 80%
- 集成测试覆盖主要业务流程
- 关键功能必须有测试用例

## 部署流程

### 开发环境

```bash
# 启动开发服务
npm run dev

# 或使用 PM2
pm2 start ecosystem.config.js
```

### 测试环境

```bash
# 部署到测试环境
./scripts/deploy.sh staging
```

### 生产环境

```bash
# 部署到生产环境
./scripts/deploy.sh production

# 使用 Docker
docker-compose up -d
```

### 发布流程

1. **功能开发**: 在 feature 分支开发
2. **代码审查**: 提交 Pull Request
3. **测试验证**: 在测试环境验证功能
4. **合并主分支**: 合并到 main 分支
5. **生产部署**: 部署到生产环境
6. **监控验证**: 监控服务状态和性能

## 常见问题

### Q: 如何添加新的微服务？

A: 
1. 在 `backend/` 目录下创建新服务目录
2. 复制现有服务的基础结构
3. 修改 `package.json` 和服务配置
4. 在 API 网关中添加路由配置
5. 更新 `docker-compose.yml` 和 `ecosystem.config.js`

### Q: 如何处理数据库迁移？

A:
1. 在 `database/migrations/` 目录创建新的 SQL 文件
2. 按照命名规范：`序号_描述.sql`
3. 在部署脚本中执行迁移
4. 测试环境验证后再应用到生产环境

### Q: 如何调试微服务？

A:
1. 使用 `console.log` 或 `debug` 模块输出日志
2. 在 VS Code 中配置断点调试
3. 使用 Postman 测试 API 接口
4. 查看 PM2 日志：`pm2 logs [service-name]`

### Q: 如何优化性能？

A:
1. 使用 Redis 缓存热点数据
2. 优化数据库查询和索引
3. 使用连接池管理数据库连接
4. 启用 Gzip 压缩
5. 使用 CDN 加速静态资源

### Q: 如何监控服务状态？

A:
1. 使用 PM2 监控进程状态
2. 配置健康检查接口
3. 使用 Nginx 日志分析访问情况
4. 集成第三方监控服务（如 New Relic、DataDog）

## 相关链接

- [项目 README](../README.md)
- [API 文档](./api-documentation.md)
- [数据库设计](../database/schemas/database-design.md)
- [部署指南](./deployment-guide.md)