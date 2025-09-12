# WeDraw API 文档

## 概述

WeDraw API 是基于 RESTful 架构设计的微服务 API，提供完整的微信生态营销平台功能。

**基础信息**:
- 基础URL: `http://localhost:3000` (开发环境)
- API版本: v1
- 数据格式: JSON
- 字符编码: UTF-8

## 认证方式

### JWT Token 认证

所有需要认证的接口都需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 获取 Token

通过登录接口获取 JWT Token：

```http
POST /auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

## 用户认证 API

### 用户登录

```http
POST /auth/login
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@wedraw.com",
      "nickname": "系统管理员",
      "roles": ["super_admin"]
    }
  }
}
```

### 用户注册

```http
POST /auth/register
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| username | string | 是 | 用户名 (3-20字符) |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 (6-20字符) |
| nickname | string | 否 | 昵称 |

### 刷新 Token

```http
POST /auth/refresh
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| refreshToken | string | 是 | 刷新令牌 |

### 用户登出

```http
POST /auth/logout
Authorization: Bearer <token>
```

## 用户管理 API

### 获取用户列表

```http
GET /api/users
Authorization: Bearer <token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码 (默认: 1) |
| limit | number | 否 | 每页数量 (默认: 20) |
| search | string | 否 | 搜索关键词 |
| status | number | 否 | 用户状态 (0-禁用, 1-启用) |

### 获取用户详情

```http
GET /api/users/:id
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "nickname": "John Doe",
    "status": 1,
    "profile": {
      "realName": "约翰·多伊",
      "phone": "13800138000",
      "avatar": "https://example.com/avatar.jpg",
      "company": "Example Corp",
      "position": "开发工程师"
    },
    "roles": ["user"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 创建用户

```http
POST /api/users
Authorization: Bearer <token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| email | string | 是 | 邮箱 |
| password | string | 是 | 密码 |
| nickname | string | 否 | 昵称 |
| roles | array | 否 | 角色ID数组 |

### 更新用户

```http
PUT /api/users/:id
Authorization: Bearer <token>
```

### 删除用户

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

## 微信公众号 API

### 获取公众号配置

```http
GET /api/official/config
Authorization: Bearer <token>
```

### 更新公众号配置

```http
PUT /api/official/config
Authorization: Bearer <token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| appId | string | 是 | 公众号 AppID |
| appSecret | string | 是 | 公众号 AppSecret |
| token | string | 是 | 验证令牌 |
| encodingAESKey | string | 否 | 消息加解密密钥 |

### 获取粉丝列表

```http
GET /api/official/fans
Authorization: Bearer <token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |
| status | number | 否 | 关注状态 (0-未关注, 1-已关注) |

### 发送消息

```http
POST /api/official/message
Authorization: Bearer <token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| toUser | string | 是 | 接收用户 OpenID |
| msgType | string | 是 | 消息类型 (text, image, news) |
| content | object | 是 | 消息内容 |

**文本消息示例**:

```json
{
  "toUser": "openid123",
  "msgType": "text",
  "content": {
    "text": "Hello, World!"
  }
}
```

### 获取消息列表

```http
GET /api/official/messages
Authorization: Bearer <token>
```

## 企业微信 API

### 获取应用配置

```http
GET /api/wecom/apps
Authorization: Bearer <token>
```

### 创建应用

```http
POST /api/wecom/apps
Authorization: Bearer <token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| corpId | string | 是 | 企业ID |
| corpSecret | string | 是 | 应用密钥 |
| agentId | number | 是 | 应用ID |
| name | string | 是 | 应用名称 |

### 发送应用消息

```http
POST /api/wecom/message
Authorization: Bearer <token>
```

### 获取部门列表

```http
GET /api/wecom/departments
Authorization: Bearer <token>
```

### 获取用户列表

```http
GET /api/wecom/users
Authorization: Bearer <token>
```

## 小程序 API

### 获取小程序配置

```http
GET /api/miniprogram/config
Authorization: Bearer <token>
```

### 获取用户列表

```http
GET /api/miniprogram/users
Authorization: Bearer <token>
```

### 获取用户行为数据

```http
GET /api/miniprogram/behaviors
Authorization: Bearer <token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| userId | string | 否 | 用户ID |
| action | string | 否 | 行为类型 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 记录用户行为

```http
POST /api/miniprogram/behaviors
Authorization: Bearer <token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| userId | string | 是 | 用户ID |
| action | string | 是 | 行为类型 |
| page | string | 否 | 页面路径 |
| data | object | 否 | 附加数据 |

## 积分商城 API

### 获取积分账户

```http
GET /api/points/account/:userId
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "totalPoints": 1500,
    "availablePoints": 1200,
    "frozenPoints": 300,
    "level": {
      "id": 2,
      "name": "白银会员",
      "minPoints": 1000,
      "maxPoints": 4999
    }
  }
}
```

### 获取积分记录

```http
GET /api/points/transactions
Authorization: Bearer <token>
```

### 获取商品列表

```http
GET /api/points/products
Authorization: Bearer <token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| categoryId | number | 否 | 分类ID |
| minPoints | number | 否 | 最低积分 |
| maxPoints | number | 否 | 最高积分 |
| status | number | 否 | 商品状态 |

### 积分兑换

```http
POST /api/points/exchange
Authorization: Bearer <token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| productId | number | 是 | 商品ID |
| quantity | number | 是 | 兑换数量 |
| address | object | 否 | 收货地址 (实物商品必填) |

### 获取订单列表

```http
GET /api/points/orders
Authorization: Bearer <token>
```

### 获取订单详情

```http
GET /api/points/orders/:id
Authorization: Bearer <token>
```

## 消息中心 API

### 获取消息模板

```http
GET /api/message/templates
Authorization: Bearer <token>
```

### 创建消息模板

```http
POST /api/message/templates
Authorization: Bearer <token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| name | string | 是 | 模板名称 |
| type | string | 是 | 消息类型 (system, email, sms) |
| title | string | 是 | 消息标题 |
| content | string | 是 | 消息内容 |
| variables | object | 否 | 变量定义 |

### 发送消息

```http
POST /api/message/send
Authorization: Bearer <token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| templateId | number | 是 | 模板ID |
| recipients | array | 是 | 接收者列表 |
| variables | object | 否 | 模板变量 |
| priority | number | 否 | 优先级 (1-5) |

### 获取消息队列

```http
GET /api/message/queue
Authorization: Bearer <token>
```

### 获取系统通知

```http
GET /api/message/notifications
Authorization: Bearer <token>
```

## 数据分析 API

### 获取用户统计

```http
GET /api/analysis/users
Authorization: Bearer <token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | 结束日期 (YYYY-MM-DD) |
| platform | string | 否 | 平台 (official, wecom, miniprogram) |
| granularity | string | 否 | 粒度 (day, week, month) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 10000,
      "newUsers": 150,
      "activeUsers": 1200,
      "growthRate": 0.15
    },
    "timeline": [
      {
        "date": "2024-01-01",
        "newUsers": 25,
        "activeUsers": 200,
        "totalUsers": 9850
      }
    ]
  }
}
```

### 获取消息统计

```http
GET /api/analysis/messages
Authorization: Bearer <token>
```

### 获取积分统计

```http
GET /api/analysis/points
Authorization: Bearer <token>
```

### 获取实时数据

```http
GET /api/analysis/realtime
Authorization: Bearer <token>
```

### 生成报表

```http
POST /api/analysis/reports
Authorization: Bearer <token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| type | string | 是 | 报表类型 |
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |
| format | string | 否 | 导出格式 (json, csv, excel) |

## 错误码说明

| 错误码 | HTTP状态码 | 描述 |
|--------|------------|------|
| SUCCESS | 200 | 请求成功 |
| CREATED | 201 | 资源创建成功 |
| BAD_REQUEST | 400 | 请求参数错误 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 422 | 数据验证失败 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |

### 业务错误码

| 错误码 | 描述 |
|--------|------|
| USER_NOT_FOUND | 用户不存在 |
| USER_ALREADY_EXISTS | 用户已存在 |
| INVALID_CREDENTIALS | 用户名或密码错误 |
| TOKEN_EXPIRED | Token已过期 |
| INSUFFICIENT_POINTS | 积分不足 |
| PRODUCT_OUT_OF_STOCK | 商品库存不足 |
| WECHAT_API_ERROR | 微信API调用失败 |

## 限流说明

为了保护系统稳定性，API实施了限流策略：

- **通用接口**: 每秒最多10个请求
- **认证接口**: 每分钟最多5个请求
- **批量操作**: 每分钟最多3个请求

超出限制时返回 `429 Too Many Requests` 状态码。

## SDK 和示例

### JavaScript SDK

```javascript
// 安装
npm install wedraw-sdk

// 使用
const WeDraw = require('wedraw-sdk')

const client = new WeDraw({
  baseURL: 'http://localhost:3000',
  token: 'your-jwt-token'
})

// 获取用户列表
const users = await client.users.list()

// 发送消息
const result = await client.message.send({
  templateId: 1,
  recipients: ['user1', 'user2'],
  variables: { name: 'John' }
})
```

### cURL 示例

```bash
# 用户登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取用户列表
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer your-jwt-token"

# 创建用户
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","email":"new@example.com","password":"password123"}'
```

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 完成所有核心API接口
- 支持JWT认证
- 实现限流和错误处理

---

如有疑问或建议，请联系开发团队或提交 Issue。