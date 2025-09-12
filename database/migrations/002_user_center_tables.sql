-- 用户中心数据库表结构
USE `wedraw_user`;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) UNIQUE COMMENT '邮箱',
  `phone` VARCHAR(20) UNIQUE COMMENT '手机号',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `nickname` VARCHAR(50) COMMENT '昵称',
  `avatar` VARCHAR(255) COMMENT '头像URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
  `birthday` DATE COMMENT '生日',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `last_login_at` TIMESTAMP NULL COMMENT '最后登录时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 用户扩展信息表
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `real_name` VARCHAR(50) COMMENT '真实姓名',
  `id_card` VARCHAR(18) COMMENT '身份证号',
  `address` TEXT COMMENT '地址',
  `company` VARCHAR(100) COMMENT '公司',
  `position` VARCHAR(50) COMMENT '职位',
  `bio` TEXT COMMENT '个人简介',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户扩展信息表';

-- 用户令牌表
CREATE TABLE IF NOT EXISTS `user_tokens` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `token_type` VARCHAR(20) NOT NULL COMMENT '令牌类型：access, refresh',
  `token_hash` VARCHAR(255) NOT NULL COMMENT '令牌哈希',
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_token_type` (`token_type`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户令牌表';

-- 用户角色表
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
  `description` VARCHAR(255) COMMENT '角色描述',
  `permissions` JSON COMMENT '权限列表',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色表';

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS `user_role_relations` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `role_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `user_roles`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 用户登录日志表
CREATE TABLE IF NOT EXISTS `user_login_logs` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `login_type` VARCHAR(20) NOT NULL COMMENT '登录类型：password, sms, wechat等',
  `ip` VARCHAR(45) COMMENT 'IP地址',
  `user_agent` TEXT COMMENT 'User Agent',
  `device` VARCHAR(100) COMMENT '设备信息',
  `location` VARCHAR(100) COMMENT '登录地点',
  `status` TINYINT DEFAULT 1 COMMENT '登录状态：0-失败，1-成功',
  `error_message` VARCHAR(255) COMMENT '错误信息',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_login_type` (`login_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录日志表';