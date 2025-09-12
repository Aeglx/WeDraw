# WeDraw 数据库设计文档

## 概述

WeDraw 系统采用微服务架构，每个服务拥有独立的数据库。本文档描述了各个服务的数据表结构设计。

## 数据库列表

- `wedraw_user` - 用户中心数据库
- `wedraw_official` - 公众号服务数据库
- `wedraw_wecom` - 企业微信服务数据库
- `wedraw_miniprogram` - 小程序服务数据库
- `wedraw_points` - 积分商城数据库
- `wedraw_message` - 消息中心数据库
- `wedraw_analysis` - 数据分析数据库

## 用户中心数据库 (wedraw_user)

### users - 用户表
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  email VARCHAR(100) UNIQUE COMMENT '邮箱',
  phone VARCHAR(20) UNIQUE COMMENT '手机号',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  nickname VARCHAR(50) COMMENT '昵称',
  avatar VARCHAR(255) COMMENT '头像URL',
  gender TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
  birthday DATE COMMENT '生日',
  status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  last_login_at TIMESTAMP COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_status (status)
);
```

### user_profiles - 用户扩展信息表
```sql
CREATE TABLE user_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  real_name VARCHAR(50) COMMENT '真实姓名',
  id_card VARCHAR(18) COMMENT '身份证号',
  address TEXT COMMENT '地址',
  company VARCHAR(100) COMMENT '公司',
  position VARCHAR(50) COMMENT '职位',
  bio TEXT COMMENT '个人简介',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

### user_tokens - 用户令牌表
```sql
CREATE TABLE user_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token_type VARCHAR(20) NOT NULL COMMENT '令牌类型：access, refresh',
  token_hash VARCHAR(255) NOT NULL COMMENT '令牌哈希',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token_type (token_type),
  INDEX idx_expires_at (expires_at)
);
```

## 公众号服务数据库 (wedraw_official)

### official_accounts - 公众号配置表
```sql
CREATE TABLE official_accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '公众号名称',
  app_id VARCHAR(50) NOT NULL UNIQUE COMMENT 'AppID',
  app_secret VARCHAR(100) NOT NULL COMMENT 'AppSecret',
  token VARCHAR(50) NOT NULL COMMENT 'Token',
  encoding_aes_key VARCHAR(100) COMMENT 'EncodingAESKey',
  type TINYINT DEFAULT 1 COMMENT '类型：1-订阅号，2-服务号',
  status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_app_id (app_id),
  INDEX idx_status (status)
);
```

### official_fans - 公众号粉丝表
```sql
CREATE TABLE official_fans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  openid VARCHAR(50) NOT NULL COMMENT '微信OpenID',
  unionid VARCHAR(50) COMMENT '微信UnionID',
  nickname VARCHAR(100) COMMENT '昵称',
  avatar VARCHAR(255) COMMENT '头像',
  gender TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
  city VARCHAR(50) COMMENT '城市',
  province VARCHAR(50) COMMENT '省份',
  country VARCHAR(50) COMMENT '国家',
  language VARCHAR(20) COMMENT '语言',
  subscribe_status TINYINT DEFAULT 1 COMMENT '关注状态：0-未关注，1-已关注',
  subscribe_time TIMESTAMP COMMENT '关注时间',
  unsubscribe_time TIMESTAMP COMMENT '取消关注时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES official_accounts(id) ON DELETE CASCADE,
  UNIQUE KEY uk_account_openid (account_id, openid),
  INDEX idx_openid (openid),
  INDEX idx_unionid (unionid),
  INDEX idx_subscribe_status (subscribe_status)
);
```

### official_messages - 公众号消息表
```sql
CREATE TABLE official_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  fan_id BIGINT NOT NULL,
  msg_type VARCHAR(20) NOT NULL COMMENT '消息类型：text, image, voice, video等',
  content TEXT COMMENT '消息内容',
  media_id VARCHAR(100) COMMENT '媒体文件ID',
  pic_url VARCHAR(255) COMMENT '图片URL',
  format VARCHAR(20) COMMENT '语音格式',
  recognition TEXT COMMENT '语音识别结果',
  thumb_media_id VARCHAR(100) COMMENT '视频缩略图媒体ID',
  location_x DECIMAL(10,6) COMMENT '地理位置纬度',
  location_y DECIMAL(10,6) COMMENT '地理位置经度',
  scale INT COMMENT '地图缩放大小',
  label VARCHAR(255) COMMENT '地理位置信息',
  title VARCHAR(255) COMMENT '消息标题',
  description TEXT COMMENT '消息描述',
  url VARCHAR(500) COMMENT '消息链接',
  direction TINYINT NOT NULL COMMENT '消息方向：1-接收，2-发送',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES official_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (fan_id) REFERENCES official_fans(id) ON DELETE CASCADE,
  INDEX idx_account_id (account_id),
  INDEX idx_fan_id (fan_id),
  INDEX idx_msg_type (msg_type),
  INDEX idx_direction (direction),
  INDEX idx_created_at (created_at)
);
```

### official_menus - 公众号菜单表
```sql
CREATE TABLE official_menus (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  parent_id BIGINT DEFAULT 0 COMMENT '父菜单ID，0为一级菜单',
  name VARCHAR(50) NOT NULL COMMENT '菜单名称',
  type VARCHAR(20) COMMENT '菜单类型：click, view, miniprogram等',
  key_value VARCHAR(100) COMMENT '菜单KEY值',
  url VARCHAR(500) COMMENT '网页链接',
  media_id VARCHAR(100) COMMENT '媒体文件ID',
  appid VARCHAR(50) COMMENT '小程序AppID',
  pagepath VARCHAR(200) COMMENT '小程序页面路径',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES official_accounts(id) ON DELETE CASCADE,
  INDEX idx_account_id (account_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_status (status)
);
```

## 企业微信服务数据库 (wedraw_wecom)

### wecom_apps - 企业微信应用表
```sql
CREATE TABLE wecom_apps (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  corp_id VARCHAR(50) NOT NULL COMMENT '企业ID',
  agent_id INT NOT NULL COMMENT '应用ID',
  secret VARCHAR(100) NOT NULL COMMENT '应用Secret',
  name VARCHAR(100) NOT NULL COMMENT '应用名称',
  description TEXT COMMENT '应用描述',
  redirect_domain VARCHAR(255) COMMENT '可信域名',
  report_location_flag TINYINT DEFAULT 0 COMMENT '是否上报地理位置',
  is_reportenter TINYINT DEFAULT 0 COMMENT '是否接收用户变更通知',
  home_url VARCHAR(500) COMMENT '应用主页URL',
  status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_corp_agent (corp_id, agent_id),
  INDEX idx_corp_id (corp_id),
  INDEX idx_status (status)
);
```

### wecom_users - 企业微信用户表
```sql
CREATE TABLE wecom_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  app_id BIGINT NOT NULL,
  userid VARCHAR(50) NOT NULL COMMENT '用户ID',
  name VARCHAR(100) COMMENT '用户名称',
  alias VARCHAR(100) COMMENT '用户别名',
  mobile VARCHAR(20) COMMENT '手机号',
  department JSON COMMENT '部门列表',
  order JSON COMMENT '部门内的排序值',
  position VARCHAR(100) COMMENT '职务信息',
  gender TINYINT DEFAULT 0 COMMENT '性别：0-未定义，1-男，2-女',
  email VARCHAR(100) COMMENT '邮箱',
  telephone VARCHAR(50) COMMENT '座机',
  is_leader_in_dept JSON COMMENT '在所在的部门内是否为部门负责人',
  avatar VARCHAR(255) COMMENT '头像URL',
  thumb_avatar VARCHAR(255) COMMENT '头像缩略图URL',
  qr_code VARCHAR(255) COMMENT '员工个人二维码',
  external_profile JSON COMMENT '成员对外属性',
  external_position VARCHAR(100) COMMENT '对外职务',
  address VARCHAR(255) COMMENT '地址',
  open_userid VARCHAR(50) COMMENT 'open_userid',
  main_department INT COMMENT '主部门',
  status TINYINT DEFAULT 1 COMMENT '激活状态：1-已激活，2-已禁用，4-未激活，5-退出企业',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES wecom_apps(id) ON DELETE CASCADE,
  UNIQUE KEY uk_app_userid (app_id, userid),
  INDEX idx_mobile (mobile),
  INDEX idx_email (email),
  INDEX idx_status (status)
);
```

### wecom_departments - 企业微信部门表
```sql
CREATE TABLE wecom_departments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  app_id BIGINT NOT NULL,
  dept_id INT NOT NULL COMMENT '部门ID',
  name VARCHAR(100) NOT NULL COMMENT '部门名称',
  name_en VARCHAR(100) COMMENT '英文名称',
  parent_id INT DEFAULT 0 COMMENT '父部门ID',
  order INT DEFAULT 0 COMMENT '在父部门中的次序值',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES wecom_apps(id) ON DELETE CASCADE,
  UNIQUE KEY uk_app_dept (app_id, dept_id),
  INDEX idx_parent_id (parent_id)
);
```

## 小程序服务数据库 (wedraw_miniprogram)

### miniprogram_apps - 小程序应用表
```sql
CREATE TABLE miniprogram_apps (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '小程序名称',
  app_id VARCHAR(50) NOT NULL UNIQUE COMMENT 'AppID',
  app_secret VARCHAR(100) NOT NULL COMMENT 'AppSecret',
  version VARCHAR(20) COMMENT '版本号',
  description TEXT COMMENT '描述',
  status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_app_id (app_id),
  INDEX idx_status (status)
);
```

### miniprogram_users - 小程序用户表
```sql
CREATE TABLE miniprogram_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  app_id BIGINT NOT NULL,
  openid VARCHAR(50) NOT NULL COMMENT '小程序OpenID',
  unionid VARCHAR(50) COMMENT 'UnionID',
  session_key VARCHAR(100) COMMENT 'session_key',
  nickname VARCHAR(100) COMMENT '昵称',
  avatar VARCHAR(255) COMMENT '头像',
  gender TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
  city VARCHAR(50) COMMENT '城市',
  province VARCHAR(50) COMMENT '省份',
  country VARCHAR(50) COMMENT '国家',
  language VARCHAR(20) COMMENT '语言',
  last_login_at TIMESTAMP COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES miniprogram_apps(id) ON DELETE CASCADE,
  UNIQUE KEY uk_app_openid (app_id, openid),
  INDEX idx_openid (openid),
  INDEX idx_unionid (unionid)
);
```

### miniprogram_user_actions - 小程序用户行为表
```sql
CREATE TABLE miniprogram_user_actions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  app_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  action_type VARCHAR(50) NOT NULL COMMENT '行为类型：page_view, button_click, form_submit等',
  page_path VARCHAR(200) COMMENT '页面路径',
  action_data JSON COMMENT '行为数据',
  ip VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT 'User Agent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES miniprogram_apps(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES miniprogram_users(id) ON DELETE CASCADE,
  INDEX idx_app_id (app_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
);
```

## 积分商城数据库 (wedraw_points)

### points_accounts - 积分账户表
```sql
CREATE TABLE points_accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  total_points INT DEFAULT 0 COMMENT '总积分',
  available_points INT DEFAULT 0 COMMENT '可用积分',
  frozen_points INT DEFAULT 0 COMMENT '冻结积分',
  level INT DEFAULT 1 COMMENT '积分等级',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_id (user_id),
  INDEX idx_level (level)
);
```

### points_transactions - 积分交易记录表
```sql
CREATE TABLE points_transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  transaction_type TINYINT NOT NULL COMMENT '交易类型：1-获得，2-消费，3-冻结，4-解冻',
  points INT NOT NULL COMMENT '积分数量',
  balance_after INT NOT NULL COMMENT '交易后余额',
  source VARCHAR(50) NOT NULL COMMENT '积分来源：sign_in, purchase, exchange等',
  source_id VARCHAR(100) COMMENT '来源ID',
  description VARCHAR(255) COMMENT '描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES points_accounts(id) ON DELETE CASCADE,
  INDEX idx_account_id (account_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_source (source),
  INDEX idx_created_at (created_at)
);
```

### points_products - 积分商品表
```sql
CREATE TABLE points_products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL COMMENT '商品名称',
  description TEXT COMMENT '商品描述',
  image VARCHAR(255) COMMENT '商品图片',
  category_id BIGINT COMMENT '分类ID',
  points_price INT NOT NULL COMMENT '积分价格',
  stock INT DEFAULT 0 COMMENT '库存数量',
  sales_count INT DEFAULT 0 COMMENT '销售数量',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态：0-下架，1-上架',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_sort_order (sort_order)
);
```

### points_orders - 积分订单表
```sql
CREATE TABLE points_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  product_id BIGINT NOT NULL COMMENT '商品ID',
  product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
  points_price INT NOT NULL COMMENT '积分价格',
  quantity INT DEFAULT 1 COMMENT '数量',
  total_points INT NOT NULL COMMENT '总积分',
  status TINYINT DEFAULT 1 COMMENT '订单状态：1-待发货，2-已发货，3-已完成，4-已取消',
  shipping_info JSON COMMENT '收货信息',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES points_products(id),
  INDEX idx_order_no (order_no),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

## 消息中心数据库 (wedraw_message)

### message_templates - 消息模板表
```sql
CREATE TABLE message_templates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '模板名称',
  type VARCHAR(20) NOT NULL COMMENT '消息类型：email, sms, wechat, system',
  title VARCHAR(200) COMMENT '消息标题',
  content TEXT NOT NULL COMMENT '消息内容',
  variables JSON COMMENT '模板变量',
  status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_status (status)
);
```

### message_queue - 消息队列表
```sql
CREATE TABLE message_queue (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT COMMENT '模板ID',
  recipient VARCHAR(200) NOT NULL COMMENT '接收者',
  type VARCHAR(20) NOT NULL COMMENT '消息类型：email, sms, wechat, system',
  title VARCHAR(200) COMMENT '消息标题',
  content TEXT NOT NULL COMMENT '消息内容',
  data JSON COMMENT '消息数据',
  priority TINYINT DEFAULT 5 COMMENT '优先级：1-最高，5-普通，10-最低',
  status TINYINT DEFAULT 0 COMMENT '状态：0-待发送，1-发送中，2-发送成功，3-发送失败',
  retry_count INT DEFAULT 0 COMMENT '重试次数',
  max_retry INT DEFAULT 3 COMMENT '最大重试次数',
  error_message TEXT COMMENT '错误信息',
  scheduled_at TIMESTAMP COMMENT '计划发送时间',
  sent_at TIMESTAMP COMMENT '实际发送时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES message_templates(id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_scheduled_at (scheduled_at),
  INDEX idx_created_at (created_at)
);
```

### system_notifications - 系统通知表
```sql
CREATE TABLE system_notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT NOT NULL COMMENT '通知内容',
  type VARCHAR(20) DEFAULT 'info' COMMENT '通知类型：info, warning, error, success',
  is_read TINYINT DEFAULT 0 COMMENT '是否已读：0-未读，1-已读',
  read_at TIMESTAMP COMMENT '阅读时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
);
```

## 数据分析数据库 (wedraw_analysis)

### user_statistics - 用户统计表
```sql
CREATE TABLE user_statistics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL COMMENT '统计日期',
  platform VARCHAR(20) NOT NULL COMMENT '平台：official, wecom, miniprogram',
  new_users INT DEFAULT 0 COMMENT '新增用户数',
  active_users INT DEFAULT 0 COMMENT '活跃用户数',
  total_users INT DEFAULT 0 COMMENT '累计用户数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_date_platform (date, platform),
  INDEX idx_date (date),
  INDEX idx_platform (platform)
);
```

### message_statistics - 消息统计表
```sql
CREATE TABLE message_statistics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL COMMENT '统计日期',
  platform VARCHAR(20) NOT NULL COMMENT '平台：official, wecom, miniprogram',
  message_type VARCHAR(20) NOT NULL COMMENT '消息类型',
  send_count INT DEFAULT 0 COMMENT '发送数量',
  success_count INT DEFAULT 0 COMMENT '成功数量',
  fail_count INT DEFAULT 0 COMMENT '失败数量',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_date_platform_type (date, platform, message_type),
  INDEX idx_date (date),
  INDEX idx_platform (platform)
);
```

### points_statistics - 积分统计表
```sql
CREATE TABLE points_statistics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL COMMENT '统计日期',
  total_issued INT DEFAULT 0 COMMENT '总发放积分',
  total_consumed INT DEFAULT 0 COMMENT '总消费积分',
  total_orders INT DEFAULT 0 COMMENT '总订单数',
  total_amount DECIMAL(10,2) DEFAULT 0 COMMENT '总金额',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_date (date),
  INDEX idx_date (date)
);
```

## 索引优化建议

1. **时间字段索引**：所有包含 `created_at`、`updated_at` 的表都应该建立时间索引，便于按时间范围查询
2. **状态字段索引**：所有包含 `status` 字段的表都应该建立状态索引
3. **外键索引**：所有外键字段都应该建立索引
4. **复合索引**：根据业务查询需求建立复合索引，如 `(user_id, created_at)`
5. **唯一索引**：确保数据唯一性的字段建立唯一索引

## 数据库配置建议

1. **字符集**：使用 `utf8mb4` 字符集，支持 emoji 表情
2. **存储引擎**：使用 InnoDB 存储引擎
3. **时区**：统一使用 UTC 时区
4. **备份策略**：每日全量备份 + 实时增量备份
5. **监控**：监控数据库性能指标，及时优化慢查询