-- 公众号服务数据库表结构
USE `wedraw_official`;

-- 公众号配置表
CREATE TABLE IF NOT EXISTS `official_accounts` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '公众号名称',
  `app_id` VARCHAR(50) NOT NULL UNIQUE COMMENT 'AppID',
  `app_secret` VARCHAR(100) NOT NULL COMMENT 'AppSecret',
  `token` VARCHAR(50) NOT NULL COMMENT 'Token',
  `encoding_aes_key` VARCHAR(100) COMMENT 'EncodingAESKey',
  `type` TINYINT DEFAULT 1 COMMENT '类型：1-订阅号，2-服务号',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公众号配置表';

-- 公众号粉丝表
CREATE TABLE IF NOT EXISTS `official_fans` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `account_id` BIGINT NOT NULL,
  `openid` VARCHAR(50) NOT NULL COMMENT '微信OpenID',
  `unionid` VARCHAR(50) COMMENT '微信UnionID',
  `nickname` VARCHAR(100) COMMENT '昵称',
  `avatar` VARCHAR(255) COMMENT '头像',
  `gender` TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
  `city` VARCHAR(50) COMMENT '城市',
  `province` VARCHAR(50) COMMENT '省份',
  `country` VARCHAR(50) COMMENT '国家',
  `language` VARCHAR(20) COMMENT '语言',
  `subscribe_status` TINYINT DEFAULT 1 COMMENT '关注状态：0-未关注，1-已关注',
  `subscribe_time` TIMESTAMP NULL COMMENT '关注时间',
  `unsubscribe_time` TIMESTAMP NULL COMMENT '取消关注时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`account_id`) REFERENCES `official_accounts`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_account_openid` (`account_id`, `openid`),
  INDEX `idx_openid` (`openid`),
  INDEX `idx_unionid` (`unionid`),
  INDEX `idx_subscribe_status` (`subscribe_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公众号粉丝表';

-- 公众号消息表
CREATE TABLE IF NOT EXISTS `official_messages` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `account_id` BIGINT NOT NULL,
  `fan_id` BIGINT NOT NULL,
  `msg_type` VARCHAR(20) NOT NULL COMMENT '消息类型：text, image, voice, video等',
  `content` TEXT COMMENT '消息内容',
  `media_id` VARCHAR(100) COMMENT '媒体文件ID',
  `pic_url` VARCHAR(255) COMMENT '图片URL',
  `format` VARCHAR(20) COMMENT '语音格式',
  `recognition` TEXT COMMENT '语音识别结果',
  `thumb_media_id` VARCHAR(100) COMMENT '视频缩略图媒体ID',
  `location_x` DECIMAL(10,6) COMMENT '地理位置纬度',
  `location_y` DECIMAL(10,6) COMMENT '地理位置经度',
  `scale` INT COMMENT '地图缩放大小',
  `label` VARCHAR(255) COMMENT '地理位置信息',
  `title` VARCHAR(255) COMMENT '消息标题',
  `description` TEXT COMMENT '消息描述',
  `url` VARCHAR(500) COMMENT '消息链接',
  `direction` TINYINT NOT NULL COMMENT '消息方向：1-接收，2-发送',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`account_id`) REFERENCES `official_accounts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fan_id`) REFERENCES `official_fans`(`id`) ON DELETE CASCADE,
  INDEX `idx_account_id` (`account_id`),
  INDEX `idx_fan_id` (`fan_id`),
  INDEX `idx_msg_type` (`msg_type`),
  INDEX `idx_direction` (`direction`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公众号消息表';

-- 公众号菜单表
CREATE TABLE IF NOT EXISTS `official_menus` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `account_id` BIGINT NOT NULL,
  `parent_id` BIGINT DEFAULT 0 COMMENT '父菜单ID，0为一级菜单',
  `name` VARCHAR(50) NOT NULL COMMENT '菜单名称',
  `type` VARCHAR(20) COMMENT '菜单类型：click, view, miniprogram等',
  `key_value` VARCHAR(100) COMMENT '菜单KEY值',
  `url` VARCHAR(500) COMMENT '网页链接',
  `media_id` VARCHAR(100) COMMENT '媒体文件ID',
  `appid` VARCHAR(50) COMMENT '小程序AppID',
  `pagepath` VARCHAR(200) COMMENT '小程序页面路径',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`account_id`) REFERENCES `official_accounts`(`id`) ON DELETE CASCADE,
  INDEX `idx_account_id` (`account_id`),
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公众号菜单表';

-- 公众号自动回复表
CREATE TABLE IF NOT EXISTS `official_auto_replies` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `account_id` BIGINT NOT NULL,
  `trigger_type` VARCHAR(20) NOT NULL COMMENT '触发类型：keyword, subscribe, default',
  `keyword` VARCHAR(100) COMMENT '关键词',
  `match_type` TINYINT DEFAULT 1 COMMENT '匹配类型：1-完全匹配，2-包含匹配',
  `reply_type` VARCHAR(20) NOT NULL COMMENT '回复类型：text, image, news等',
  `content` TEXT COMMENT '回复内容',
  `media_id` VARCHAR(100) COMMENT '媒体文件ID',
  `articles` JSON COMMENT '图文消息内容',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`account_id`) REFERENCES `official_accounts`(`id`) ON DELETE CASCADE,
  INDEX `idx_account_id` (`account_id`),
  INDEX `idx_trigger_type` (`trigger_type`),
  INDEX `idx_keyword` (`keyword`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公众号自动回复表';

-- 公众号素材表
CREATE TABLE IF NOT EXISTS `official_materials` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `account_id` BIGINT NOT NULL,
  `media_id` VARCHAR(100) NOT NULL COMMENT '媒体文件ID',
  `type` VARCHAR(20) NOT NULL COMMENT '素材类型：image, voice, video, thumb',
  `name` VARCHAR(200) COMMENT '素材名称',
  `filename` VARCHAR(255) COMMENT '文件名',
  `url` VARCHAR(500) COMMENT '素材URL',
  `size` INT COMMENT '文件大小',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`account_id`) REFERENCES `official_accounts`(`id`) ON DELETE CASCADE,
  INDEX `idx_account_id` (`account_id`),
  INDEX `idx_media_id` (`media_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公众号素材表';