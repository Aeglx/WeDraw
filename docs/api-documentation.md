# WeDraw平台API文档

## 概述

本文档描述了WeDraw平台的API接口规范，所有API请求都通过API网关统一入口进行处理。

**基础URL**: `http://localhost:3000`

## 认证

### JWT Token认证

大部分API需要在请求头中携带JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 获取Token

**POST** `/api/v1/user/login`

请求体：
```json
{
  "username": "admin",
  "password": "password"
}
```

响应：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

## 用户中心API

### 用户管理

#### 获取用户列表
**GET** `/api/v1/user/list`

查询参数：
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `keyword`: 搜索关键词

响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin",
        "status": 1,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

#### 创建用户
**POST** `/api/v1/user/create`

请求体：
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

#### 更新用户
**PUT** `/api/v1/user/:id`

#### 删除用户
**DELETE** `/api/v1/user/:id`

### 角色权限管理

#### 获取角色列表
**GET** `/api/v1/user/roles`

#### 获取权限列表
**GET** `/api/v1/user/permissions`

## 公众号API

### 粉丝管理

#### 获取粉丝列表
**GET** `/api/v1/official/fans`

查询参数：
- `page`: 页码
- `limit`: 每页数量
- `tag`: 标签筛选
- `keyword`: 搜索关键词

#### 获取粉丝详情
**GET** `/api/v1/official/fans/:openid`

#### 给粉丝打标签
**POST** `/api/v1/official/fans/:openid/tags`

请求体：
```json
{
  "tags": ["VIP", "活跃用户"]
}
```

### 消息管理

#### 发送模板消息
**POST** `/api/v1/official/message/template`

请求体：
```json
{
  "openids": ["openid1", "openid2"],
  "template_id": "template_id",
  "data": {
    "first": "您好",
    "keyword1": "订单号123",
    "keyword2": "2024-01-01",
    "remark": "感谢您的支持"
  }
}
```

#### 发送客服消息
**POST** `/api/v1/official/message/custom`

### 菜单管理

#### 获取菜单配置
**GET** `/api/v1/official/menu`

#### 更新菜单配置
**POST** `/api/v1/official/menu`

## 企业微信API

### 通讯录管理

#### 获取部门列表
**GET** `/api/v1/wecom/departments`

#### 获取部门成员
**GET** `/api/v1/wecom/departments/:id/members`

#### 创建部门
**POST** `/api/v1/wecom/departments`

### 群聊管理

#### 获取群聊列表
**GET** `/api/v1/wecom/groups`

#### 获取群聊详情
**GET** `/api/v1/wecom/groups/:id`

### 机器人管理

#### 获取机器人列表
**GET** `/api/v1/wecom/robots`

#### 发送机器人消息
**POST** `/api/v1/wecom/robots/:id/send`

## 小程序API

### 用户管理

#### 获取小程序用户列表
**GET** `/api/v1/miniprogram/users`

#### 获取用户详情
**GET** `/api/v1/miniprogram/users/:openid`

### 消息推送

#### 发送订阅消息
**POST** `/api/v1/miniprogram/message/subscribe`

## 积分商城API

### 积分管理

#### 获取用户积分
**GET** `/api/v1/points/user/:userId/balance`

#### 积分变动记录
**GET** `/api/v1/points/user/:userId/records`

#### 增加积分
**POST** `/api/v1/points/user/:userId/add`

请求体：
```json
{
  "amount": 100,
  "reason": "签到奖励",
  "type": "signin"
}
```

#### 扣减积分
**POST** `/api/v1/points/user/:userId/deduct`

### 商品管理

#### 获取商品列表
**GET** `/api/v1/points/goods`

查询参数：
- `page`: 页码
- `limit`: 每页数量
- `category`: 分类
- `status`: 状态（1=上架，0=下架）

#### 获取商品详情
**GET** `/api/v1/points/goods/:id`

#### 创建商品
**POST** `/api/v1/points/goods`

请求体：
```json
{
  "name": "商品名称",
  "description": "商品描述",
  "points": 1000,
  "stock": 100,
  "category": "电子产品",
  "image": "商品图片URL"
}
```

### 订单管理

#### 创建兑换订单
**POST** `/api/v1/points/orders`

请求体：
```json
{
  "user_id": 1,
  "goods_id": 1,
  "quantity": 1,
  "address": {
    "name": "收货人",
    "phone": "手机号",
    "address": "收货地址"
  }
}
```

#### 获取订单列表
**GET** `/api/v1/points/orders`

#### 更新订单状态
**PUT** `/api/v1/points/orders/:id/status`

## 消息中心API

### 消息模板管理

#### 获取模板列表
**GET** `/api/v1/message/templates`

#### 创建消息模板
**POST** `/api/v1/message/templates`

### 消息发送

#### 发送消息
**POST** `/api/v1/message/send`

请求体：
```json
{
  "type": "wechat_template",
  "recipients": ["openid1", "openid2"],
  "template_id": "template_id",
  "data": {}
}
```

## 数据分析API

### 统计数据

#### 获取用户统计
**GET** `/api/v1/analysis/users/stats`

#### 获取订单统计
**GET** `/api/v1/analysis/orders/stats`

#### 获取积分统计
**GET** `/api/v1/analysis/points/stats`

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 禁止访问，权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 请求参数验证失败 |
| 500 | 服务器内部错误 |

## 响应格式

所有API响应都遵循统一格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1640995200000
}
```

- `code`: 状态码
- `message`: 响应消息
- `data`: 响应数据
- `timestamp`: 时间戳

## 分页格式

列表接口的分页响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```