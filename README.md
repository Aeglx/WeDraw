# 企业微信、公众号、小程序及积分商城管理平台

## 项目概述

本项目是一个基于微信生态的用户运营体系，结合积分商城形成激励闭环。采用微服务架构，实现公众号、企业微信、小程序、积分商城四大模块独立开发、部署与迭代。

## 系统架构

```
客户端层 → API网关层 → 微服务层 → 数据存储层 → 基础设施层
```

### 技术栈

- **前端**: Vue3 + Vite + Pinia + Element Plus
- **后端**: Node.js 16.x + Express + Sequelize
- **数据存储**: MySQL 8.0 + Redis 6.x
- **中间件**: RabbitMQ + Nginx + JWT
- **部署工具**: Supervisor + Jenkins

## 项目结构

```
.
├── frontend/                 # 前端应用
│   ├── admin-web/            # 管理后台
│   ├── miniprogram/          # 小程序前端
│   ├── official-h5/          # 公众号H5页面
│   ├── wecom-h5/             # 企业微信H5页面
│   └── points-h5/            # 积分商城H5页面
├── backend/                  # 后端服务
│   ├── api-gateway/          # API网关服务
│   ├── user-center/          # 用户中心服务
│   ├── official/             # 公众号服务
│   ├── wecom/                # 企业微信服务
│   ├── miniprogram/          # 小程序服务
│   ├── points/               # 积分商城服务
│   ├── message/              # 消息中心服务
│   └── analysis/             # 数据分析服务
├── database/                 # 数据库相关
│   ├── migrations/           # 数据库迁移文件
│   ├── seeds/                # 初始数据
│   └── schemas/              # 数据库设计文档
├── deployment/               # 部署配置
│   ├── nginx/                # Nginx配置
│   ├── supervisor/           # Supervisor配置
│   ├── docker/               # Docker配置
│   └── scripts/              # 部署脚本
├── docs/                     # 项目文档
└── shared/                   # 共享资源
    ├── configs/              # 共享配置
    ├── utils/                # 共享工具
    └── types/                # 共享类型定义
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.x
- RabbitMQ >= 3.8

### 安装依赖

```bash
# 安装所有依赖
npm run install:all

# 或分别安装
npm run install:frontend
npm run install:backend
```

### 数据库初始化

```bash
# 创建数据库
mysql -u root -p < database/schemas/create_databases.sql

# 运行迁移
cd backend/user-center && npm run migrate
cd backend/official && npm run migrate
# ... 其他服务
```

### 启动服务

```bash
# 启动API网关
cd backend/api-gateway && npm run dev

# 启动各个微服务
cd backend/user-center && npm run dev
cd backend/official && npm run dev
# ... 其他服务

# 启动前端应用
cd frontend/admin-web && npm run dev
```

## 核心功能模块

### 公众号管理
- 粉丝管理：列表筛选、详情查看、标签管理、增长统计
- 消息管理：模板消息发送、客服回复、送达统计
- 菜单回复：自定义菜单配置、自动回复规则设置

### 企业微信管理
- 通讯录：部门层级管理、成员信息维护、标签管理
- 外部群聊：群列表管理、成员管理、欢迎语设置
- 机器人：配置管理、消息发送、权限控制

### 小程序管理
- 用户管理：用户列表、行为记录
- 消息管理：模板消息配置与发送
- 基础配置：域名与参数设置

### 积分商城
- 积分管理：规则设置、积分查询、统计分析
- 商品管理：商品上下架、库存管理
- 订单管理：订单处理、状态跟踪

### 系统管理
- 用户权限：账号管理、角色配置、操作日志
- 系统配置：参数设置、接口配置、数据备份

## API文档

启动服务后访问 `/api/docs` 查看Swagger文档

## 部署说明

详见 `deployment/` 目录下的部署文档和配置文件

## 开发规范

- 代码规范：ESLint + Prettier
- 提交规范：Conventional Commits
- 分支策略：Git Flow

## 许可证

MIT License