-- 小程序服务数据库表结构
USE `wedraw_miniprogram`;

-- 小程序应用表
CREATE TABLE IF NOT EXISTS `miniprogram_apps` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '小程序名称',
  `app_id` VARCHAR(50) NOT NULL UNIQUE COMMENT 'AppID',
  `app_secret` VARCHAR(100) NOT NULL COMMENT 'AppSecret',
  `version` VARCHAR(20) COMMENT '版本号',
  `description` TEXT COMMENT '描述',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序应用表';

-- 小程序用户表
CREATE TABLE IF NOT EXISTS `miniprogram_users` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `openid` VARCHAR(50) NOT NULL COMMENT '小程序OpenID',
  `unionid` VARCHAR(50) COMMENT 'UnionID',
  `session_key` VARCHAR(100) COMMENT 'session_key',
  `nickname` VARCHAR(100) COMMENT '昵称',
  `avatar` VARCHAR(255) COMMENT '头像',
  `gender` TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
  `city` VARCHAR(50) COMMENT '城市',
  `province` VARCHAR(50) COMMENT '省份',
  `country` VARCHAR(50) COMMENT '国家',
  `language` VARCHAR(20) COMMENT '语言',
  `last_login_at` TIMESTAMP NULL COMMENT '最后登录时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `miniprogram_apps`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_app_openid` (`app_id`, `openid`),
  INDEX `idx_openid` (`openid`),
  INDEX `idx_unionid` (`unionid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序用户表';

-- 小程序用户行为表
CREATE TABLE IF NOT EXISTS `miniprogram_user_actions` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `action_type` VARCHAR(50) NOT NULL COMMENT '行为类型：page_view, button_click, form_submit等',
  `page_path` VARCHAR(200) COMMENT '页面路径',
  `action_data` JSON COMMENT '行为数据',
  `ip` VARCHAR(45) COMMENT 'IP地址',
  `user_agent` TEXT COMMENT 'User Agent',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `miniprogram_apps`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `miniprogram_users`(`id`) ON DELETE CASCADE,
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action_type` (`action_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序用户行为表';

-- 小程序页面访问统计表
CREATE TABLE IF NOT EXISTS `miniprogram_page_views` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `page_path` VARCHAR(200) NOT NULL COMMENT '页面路径',
  `page_title` VARCHAR(200) COMMENT '页面标题',
  `referrer` VARCHAR(200) COMMENT '来源页面',
  `stay_time` INT DEFAULT 0 COMMENT '停留时间（秒）',
  `scene` INT COMMENT '场景值',
  `share_ticket` VARCHAR(100) COMMENT '分享票据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `miniprogram_apps`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `miniprogram_users`(`id`) ON DELETE CASCADE,
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_page_path` (`page_path`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序页面访问统计表';

-- 小程序分享记录表
CREATE TABLE IF NOT EXISTS `miniprogram_shares` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `page_path` VARCHAR(200) NOT NULL COMMENT '分享页面路径',
  `title` VARCHAR(200) COMMENT '分享标题',
  `image_url` VARCHAR(500) COMMENT '分享图片',
  `share_type` VARCHAR(20) DEFAULT 'friend' COMMENT '分享类型：friend-好友，timeline-朋友圈',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `miniprogram_apps`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `miniprogram_users`(`id`) ON DELETE CASCADE,
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_share_type` (`share_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序分享记录表';

-- 小程序表单提交记录表
CREATE TABLE IF NOT EXISTS `miniprogram_form_submissions` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `form_id` VARCHAR(100) NOT NULL COMMENT '表单ID',
  `page_path` VARCHAR(200) NOT NULL COMMENT '表单页面路径',
  `form_data` JSON NOT NULL COMMENT '表单数据',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1-已提交，2-已处理',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `miniprogram_apps`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `miniprogram_users`(`id`) ON DELETE CASCADE,
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_form_id` (`form_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序表单提交记录表';

-- 小程序订阅消息表
CREATE TABLE IF NOT EXISTS `miniprogram_subscribe_messages` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `template_id` VARCHAR(100) NOT NULL COMMENT '模板ID',
  `page` VARCHAR(200) COMMENT '跳转页面',
  `data` JSON NOT NULL COMMENT '模板数据',
  `miniprogram_state` VARCHAR(20) DEFAULT 'formal' COMMENT '小程序状态：developer, trial, formal',
  `lang` VARCHAR(10) DEFAULT 'zh_CN' COMMENT '语言',
  `status` TINYINT DEFAULT 0 COMMENT '发送状态：0-待发送，1-发送成功，2-发送失败',
  `error_message` TEXT COMMENT '错误信息',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `miniprogram_apps`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `miniprogram_users`(`id`) ON DELETE CASCADE,
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_template_id` (`template_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序订阅消息表';