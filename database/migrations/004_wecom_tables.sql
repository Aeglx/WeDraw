-- 企业微信服务数据库表结构
USE `wedraw_wecom`;

-- 企业微信应用表
CREATE TABLE IF NOT EXISTS `wecom_apps` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `corp_id` VARCHAR(50) NOT NULL COMMENT '企业ID',
  `agent_id` INT NOT NULL COMMENT '应用ID',
  `secret` VARCHAR(100) NOT NULL COMMENT '应用Secret',
  `name` VARCHAR(100) NOT NULL COMMENT '应用名称',
  `description` TEXT COMMENT '应用描述',
  `redirect_domain` VARCHAR(255) COMMENT '可信域名',
  `report_location_flag` TINYINT DEFAULT 0 COMMENT '是否上报地理位置',
  `is_reportenter` TINYINT DEFAULT 0 COMMENT '是否接收用户变更通知',
  `home_url` VARCHAR(500) COMMENT '应用主页URL',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_corp_agent` (`corp_id`, `agent_id`),
  INDEX `idx_corp_id` (`corp_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业微信应用表';

-- 企业微信用户表
CREATE TABLE IF NOT EXISTS `wecom_users` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `userid` VARCHAR(50) NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) COMMENT '用户名称',
  `alias` VARCHAR(100) COMMENT '用户别名',
  `mobile` VARCHAR(20) COMMENT '手机号',
  `department` JSON COMMENT '部门列表',
  `order` JSON COMMENT '部门内的排序值',
  `position` VARCHAR(100) COMMENT '职务信息',
  `gender` TINYINT DEFAULT 0 COMMENT '性别：0-未定义，1-男，2-女',
  `email` VARCHAR(100) COMMENT '邮箱',
  `telephone` VARCHAR(50) COMMENT '座机',
  `is_leader_in_dept` JSON COMMENT '在所在的部门内是否为部门负责人',
  `avatar` VARCHAR(255) COMMENT '头像URL',
  `thumb_avatar` VARCHAR(255) COMMENT '头像缩略图URL',
  `qr_code` VARCHAR(255) COMMENT '员工个人二维码',
  `external_profile` JSON COMMENT '成员对外属性',
  `external_position` VARCHAR(100) COMMENT '对外职务',
  `address` VARCHAR(255) COMMENT '地址',
  `open_userid` VARCHAR(50) COMMENT 'open_userid',
  `main_department` INT COMMENT '主部门',
  `status` TINYINT DEFAULT 1 COMMENT '激活状态：1-已激活，2-已禁用，4-未激活，5-退出企业',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `wecom_apps`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_app_userid` (`app_id`, `userid`),
  INDEX `idx_mobile` (`mobile`),
  INDEX `idx_email` (`email`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业微信用户表';

-- 企业微信部门表
CREATE TABLE IF NOT EXISTS `wecom_departments` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `dept_id` INT NOT NULL COMMENT '部门ID',
  `name` VARCHAR(100) NOT NULL COMMENT '部门名称',
  `name_en` VARCHAR(100) COMMENT '英文名称',
  `parent_id` INT DEFAULT 0 COMMENT '父部门ID',
  `order` INT DEFAULT 0 COMMENT '在父部门中的次序值',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `wecom_apps`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_app_dept` (`app_id`, `dept_id`),
  INDEX `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业微信部门表';

-- 企业微信消息表
CREATE TABLE IF NOT EXISTS `wecom_messages` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `msg_type` VARCHAR(20) NOT NULL COMMENT '消息类型：text, image, voice, video等',
  `touser` TEXT COMMENT '接收用户列表',
  `toparty` TEXT COMMENT '接收部门列表',
  `totag` TEXT COMMENT '接收标签列表',
  `content` TEXT COMMENT '消息内容',
  `media_id` VARCHAR(100) COMMENT '媒体文件ID',
  `title` VARCHAR(255) COMMENT '消息标题',
  `description` TEXT COMMENT '消息描述',
  `url` VARCHAR(500) COMMENT '消息链接',
  `pic_url` VARCHAR(500) COMMENT '图片链接',
  `appid` VARCHAR(50) COMMENT '小程序AppID',
  `pagepath` VARCHAR(200) COMMENT '小程序页面路径',
  `safe` TINYINT DEFAULT 0 COMMENT '是否是保密消息',
  `enable_id_trans` TINYINT DEFAULT 0 COMMENT '是否开启id转译',
  `enable_duplicate_check` TINYINT DEFAULT 0 COMMENT '是否开启重复消息检查',
  `duplicate_check_interval` INT DEFAULT 1800 COMMENT '重复消息检查时间间隔',
  `msgid` VARCHAR(100) COMMENT '消息ID',
  `status` TINYINT DEFAULT 0 COMMENT '发送状态：0-待发送，1-发送成功，2-发送失败',
  `error_message` TEXT COMMENT '错误信息',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `wecom_apps`(`id`) ON DELETE CASCADE,
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_msg_type` (`msg_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业微信消息表';

-- 企业微信群聊表
CREATE TABLE IF NOT EXISTS `wecom_groups` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `chatid` VARCHAR(50) NOT NULL COMMENT '群聊ID',
  `name` VARCHAR(100) NOT NULL COMMENT '群聊名称',
  `owner` VARCHAR(50) COMMENT '群主userid',
  `userlist` JSON COMMENT '群成员列表',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `wecom_apps`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_app_chatid` (`app_id`, `chatid`),
  INDEX `idx_owner` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业微信群聊表';

-- 企业微信机器人表
CREATE TABLE IF NOT EXISTS `wecom_robots` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `name` VARCHAR(100) NOT NULL COMMENT '机器人名称',
  `webhook_url` VARCHAR(500) NOT NULL COMMENT 'Webhook地址',
  `description` TEXT COMMENT '机器人描述',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `wecom_apps`(`id`) ON DELETE CASCADE,
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业微信机器人表';

-- 企业微信标签表
CREATE TABLE IF NOT EXISTS `wecom_tags` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `app_id` BIGINT NOT NULL,
  `tagid` INT NOT NULL COMMENT '标签ID',
  `tagname` VARCHAR(100) NOT NULL COMMENT '标签名称',
  `userlist` JSON COMMENT '标签成员列表',
  `partylist` JSON COMMENT '标签部门列表',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`app_id`) REFERENCES `wecom_apps`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_app_tagid` (`app_id`, `tagid`),
  INDEX `idx_tagname` (`tagname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业微信标签表';