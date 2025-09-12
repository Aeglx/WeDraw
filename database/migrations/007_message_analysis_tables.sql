-- 消息中心数据库表结构
USE `wedraw_message`;

-- 消息模板表
CREATE TABLE IF NOT EXISTS `message_templates` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `type` VARCHAR(20) NOT NULL COMMENT '消息类型：email, sms, wechat, system',
  `title` VARCHAR(200) COMMENT '消息标题',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `variables` JSON COMMENT '模板变量',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息模板表';

-- 消息队列表
CREATE TABLE IF NOT EXISTS `message_queue` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `template_id` BIGINT COMMENT '模板ID',
  `recipient` VARCHAR(200) NOT NULL COMMENT '接收者',
  `type` VARCHAR(20) NOT NULL COMMENT '消息类型：email, sms, wechat, system',
  `title` VARCHAR(200) COMMENT '消息标题',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `data` JSON COMMENT '消息数据',
  `priority` TINYINT DEFAULT 5 COMMENT '优先级：1-最高，5-普通，10-最低',
  `status` TINYINT DEFAULT 0 COMMENT '状态：0-待发送，1-发送中，2-发送成功，3-发送失败',
  `retry_count` INT DEFAULT 0 COMMENT '重试次数',
  `max_retry` INT DEFAULT 3 COMMENT '最大重试次数',
  `error_message` TEXT COMMENT '错误信息',
  `scheduled_at` TIMESTAMP NULL COMMENT '计划发送时间',
  `sent_at` TIMESTAMP NULL COMMENT '实际发送时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`template_id`) REFERENCES `message_templates`(`id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_scheduled_at` (`scheduled_at`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息队列表';

-- 系统通知表
CREATE TABLE IF NOT EXISTS `system_notifications` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `title` VARCHAR(200) NOT NULL COMMENT '通知标题',
  `content` TEXT NOT NULL COMMENT '通知内容',
  `type` VARCHAR(20) DEFAULT 'info' COMMENT '通知类型：info, warning, error, success',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读：0-未读，1-已读',
  `read_at` TIMESTAMP NULL COMMENT '阅读时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_type` (`type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表';

-- 邮件配置表
CREATE TABLE IF NOT EXISTS `email_configs` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '配置名称',
  `smtp_host` VARCHAR(100) NOT NULL COMMENT 'SMTP服务器',
  `smtp_port` INT NOT NULL COMMENT 'SMTP端口',
  `smtp_secure` VARCHAR(10) COMMENT '加密方式：ssl, tls',
  `smtp_user` VARCHAR(100) NOT NULL COMMENT 'SMTP用户名',
  `smtp_pass` VARCHAR(255) NOT NULL COMMENT 'SMTP密码',
  `from_name` VARCHAR(100) COMMENT '发件人名称',
  `from_email` VARCHAR(100) NOT NULL COMMENT '发件人邮箱',
  `is_default` TINYINT DEFAULT 0 COMMENT '是否默认配置',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_is_default` (`is_default`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮件配置表';

-- 短信配置表
CREATE TABLE IF NOT EXISTS `sms_configs` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '配置名称',
  `provider` VARCHAR(50) NOT NULL COMMENT '服务商：aliyun, tencent, huawei等',
  `access_key` VARCHAR(100) NOT NULL COMMENT 'AccessKey',
  `secret_key` VARCHAR(255) NOT NULL COMMENT 'SecretKey',
  `sign_name` VARCHAR(50) COMMENT '短信签名',
  `region` VARCHAR(50) COMMENT '地域',
  `endpoint` VARCHAR(200) COMMENT '接入点',
  `is_default` TINYINT DEFAULT 0 COMMENT '是否默认配置',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_provider` (`provider`),
  INDEX `idx_is_default` (`is_default`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短信配置表';

-- 短信模板表
CREATE TABLE IF NOT EXISTS `sms_templates` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `config_id` BIGINT NOT NULL,
  `name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `template_code` VARCHAR(50) NOT NULL COMMENT '模板代码',
  `template_content` TEXT NOT NULL COMMENT '模板内容',
  `template_type` VARCHAR(20) NOT NULL COMMENT '模板类型：verification, notification, promotion',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`config_id`) REFERENCES `sms_configs`(`id`) ON DELETE CASCADE,
  INDEX `idx_config_id` (`config_id`),
  INDEX `idx_template_code` (`template_code`),
  INDEX `idx_template_type` (`template_type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短信模板表';

-- 数据分析数据库表结构
USE `wedraw_analysis`;

-- 用户统计表
CREATE TABLE IF NOT EXISTS `user_statistics` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `date` DATE NOT NULL COMMENT '统计日期',
  `platform` VARCHAR(20) NOT NULL COMMENT '平台：official, wecom, miniprogram',
  `new_users` INT DEFAULT 0 COMMENT '新增用户数',
  `active_users` INT DEFAULT 0 COMMENT '活跃用户数',
  `total_users` INT DEFAULT 0 COMMENT '累计用户数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_date_platform` (`date`, `platform`),
  INDEX `idx_date` (`date`),
  INDEX `idx_platform` (`platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户统计表';

-- 消息统计表
CREATE TABLE IF NOT EXISTS `message_statistics` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `date` DATE NOT NULL COMMENT '统计日期',
  `platform` VARCHAR(20) NOT NULL COMMENT '平台：official, wecom, miniprogram',
  `message_type` VARCHAR(20) NOT NULL COMMENT '消息类型',
  `send_count` INT DEFAULT 0 COMMENT '发送数量',
  `success_count` INT DEFAULT 0 COMMENT '成功数量',
  `fail_count` INT DEFAULT 0 COMMENT '失败数量',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_date_platform_type` (`date`, `platform`, `message_type`),
  INDEX `idx_date` (`date`),
  INDEX `idx_platform` (`platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息统计表';

-- 积分统计表
CREATE TABLE IF NOT EXISTS `points_statistics` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `date` DATE NOT NULL COMMENT '统计日期',
  `total_issued` INT DEFAULT 0 COMMENT '总发放积分',
  `total_consumed` INT DEFAULT 0 COMMENT '总消费积分',
  `total_orders` INT DEFAULT 0 COMMENT '总订单数',
  `total_amount` DECIMAL(10,2) DEFAULT 0 COMMENT '总金额',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_date` (`date`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分统计表';

-- 页面访问统计表
CREATE TABLE IF NOT EXISTS `page_view_statistics` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `date` DATE NOT NULL COMMENT '统计日期',
  `platform` VARCHAR(20) NOT NULL COMMENT '平台：official, wecom, miniprogram, admin',
  `page_path` VARCHAR(200) NOT NULL COMMENT '页面路径',
  `page_title` VARCHAR(200) COMMENT '页面标题',
  `pv` INT DEFAULT 0 COMMENT '页面浏览量',
  `uv` INT DEFAULT 0 COMMENT '独立访客数',
  `bounce_rate` DECIMAL(5,2) DEFAULT 0 COMMENT '跳出率',
  `avg_stay_time` INT DEFAULT 0 COMMENT '平均停留时间（秒）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_date_platform_page` (`date`, `platform`, `page_path`),
  INDEX `idx_date` (`date`),
  INDEX `idx_platform` (`platform`),
  INDEX `idx_page_path` (`page_path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='页面访问统计表';

-- 事件统计表
CREATE TABLE IF NOT EXISTS `event_statistics` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `date` DATE NOT NULL COMMENT '统计日期',
  `platform` VARCHAR(20) NOT NULL COMMENT '平台：official, wecom, miniprogram',
  `event_type` VARCHAR(50) NOT NULL COMMENT '事件类型',
  `event_name` VARCHAR(100) NOT NULL COMMENT '事件名称',
  `count` INT DEFAULT 0 COMMENT '事件次数',
  `unique_users` INT DEFAULT 0 COMMENT '触发用户数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_date_platform_event` (`date`, `platform`, `event_type`, `event_name`),
  INDEX `idx_date` (`date`),
  INDEX `idx_platform` (`platform`),
  INDEX `idx_event_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='事件统计表';

-- 实时数据表
CREATE TABLE IF NOT EXISTS `realtime_data` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `metric_name` VARCHAR(50) NOT NULL COMMENT '指标名称',
  `metric_value` DECIMAL(15,2) NOT NULL COMMENT '指标值',
  `platform` VARCHAR(20) COMMENT '平台',
  `dimensions` JSON COMMENT '维度数据',
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '时间戳',
  INDEX `idx_metric_name` (`metric_name`),
  INDEX `idx_platform` (`platform`),
  INDEX `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实时数据表';