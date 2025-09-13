# WeDraw平台开发指南

## 项目概述

本项目是一个基于微服务架构的企业微信、公众号、小程序及积分商城管理平台，采用前后端分离的开发模式。

## 技术栈

### 后端技术栈
- **运行环境**: Node.js 16.x
- **Web框架**: Express.js
- **数据库**: MySQL 8.0
- **缓存**: Redis 6.x
- **ORM**: Sequelize
- **认证**: JWT
- **消息队列**: RabbitMQ（可选）

### 前端技术栈
- **框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **UI组件**: Element Plus（管理后台）、Vant（移动端H5）
- **小程序**: UniApp

## 项目结构

```
WeDraw/
├── backend/                    # 后端服务
│   ├── api-gateway/           # API网关服务
│   ├── user-center/           # 用户中心服务
│   ├── official/              # 公众号服务
│   ├── wecom/                 # 企业微信服务
│   ├── miniprogram/           # 小程序服务
│   ├── points/                # 积分商城服务
│   ├── message/               # 消息中心服务
│   └── analysis/              # 数据分析服务
├── frontend/                   # 前端应用
│   ├── admin-web/             # 管理后台
│   ├── official-h5/           # 公众号H5
│   ├── wecom-h5/              # 企业微信H5
│   ├── points-h5/             # 积分商城H5
│   └── miniprogram/           # 小程序
├── database/                   # 数据库相关
│   ├── migrations/            # 数据库迁移文件
│   └── seeds/                 # 初始数据
├── docs/                      # 项目文档
├── config.json                # 项目配置
├── package.json               # 项目依赖
└── .env.example               # 环境变量模板
```

## 端口规范

### 后端服务端口
- API网关: 3000
- 用户中心: 3001
- 公众号服务: 3002
- 企业微信服务: 3003
- 小程序服务: 3004
- 积分商城服务: 3005
- 消息中心服务: 3006
- 数据分析服务: 3007

### 前端应用端口
- 管理后台: 8080
- 公众号H5: 8081
- 企业微信H5: 8082
- 积分商城H5: 8083
- 小程序开发工具: 8084

## API规范

### 统一入口
所有API请求通过API网关统一入口：`http://localhost:3000`

### 路由规范
- 用户中心: `/api/v1/user`
- 公众号: `/api/v1/official`
- 企业微信: `/api/v1/wecom`
- 小程序: `/api/v1/miniprogram`
- 积分商城: `/api/v1/points`
- 消息中心: `/api/v1/message`
- 数据分析: `/api/v1/analysis`

### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1640995200000
}
```

### 错误码规范
- 200: 成功
- 400: 请求参数错误
- 401: 未授权
- 403: 禁止访问
- 404: 资源不存在
- 500: 服务器内部错误

## 开发环境搭建

### 1. 环境要求
- Node.js 16.x
- MySQL 8.0
- Redis 6.x
- Git

### 2. 项目初始化
```bash
# 克隆项目
git clone <repository-url>
cd WeDraw

# 安装依赖
npm run install:all

# 复制环境变量文件
cp .env.example .env

# 配置环境变量
vim .env
```

### 3. 数据库初始化
```bash
# 创建数据库
mysql -u root -p < database/migrations/001_init_databases.sql

# 运行迁移文件
# 各服务启动时会自动创建表结构
```

### 4. 启动服务
```bash
# 开发模式启动所有服务
npm run dev

# 或单独启动某个服务
npm run dev:gateway
npm run dev:user
```

## 开发规范

### 代码规范
- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 遵循JavaScript Standard Style

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 数据库规范
- 表名使用下划线命名法
- 字段名使用下划线命名法
- 主键统一使用`id`
- 创建时间字段：`created_at`
- 更新时间字段：`updated_at`
- 软删除字段：`deleted_at`

## 部署说明

### 开发环境
```bash
# 启动所有服务
npm run dev
```

### 生产环境
```bash
# 构建前端应用
npm run build:frontend

# 启动后端服务
npm run start
```

## 常见问题

### 1. 端口冲突
检查config.json中的端口配置，确保没有被其他程序占用。

### 2. 数据库连接失败
检查.env文件中的数据库配置是否正确。

### 3. Redis连接失败
确保Redis服务已启动，检查连接配置。

## 联系方式

如有问题，请联系开发团队或提交Issue。