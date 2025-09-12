-- 积分商城数据库表结构
USE `wedraw_points`;

-- 积分账户表
CREATE TABLE IF NOT EXISTS `points_accounts` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `total_points` INT DEFAULT 0 COMMENT '总积分',
  `available_points` INT DEFAULT 0 COMMENT '可用积分',
  `frozen_points` INT DEFAULT 0 COMMENT '冻结积分',
  `level` INT DEFAULT 1 COMMENT '积分等级',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_id` (`user_id`),
  INDEX `idx_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分账户表';

-- 积分交易记录表
CREATE TABLE IF NOT EXISTS `points_transactions` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `account_id` BIGINT NOT NULL,
  `transaction_type` TINYINT NOT NULL COMMENT '交易类型：1-获得，2-消费，3-冻结，4-解冻',
  `points` INT NOT NULL COMMENT '积分数量',
  `balance_after` INT NOT NULL COMMENT '交易后余额',
  `source` VARCHAR(50) NOT NULL COMMENT '积分来源：sign_in, purchase, exchange等',
  `source_id` VARCHAR(100) COMMENT '来源ID',
  `description` VARCHAR(255) COMMENT '描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`account_id`) REFERENCES `points_accounts`(`id`) ON DELETE CASCADE,
  INDEX `idx_account_id` (`account_id`),
  INDEX `idx_transaction_type` (`transaction_type`),
  INDEX `idx_source` (`source`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分交易记录表';

-- 积分商品分类表
CREATE TABLE IF NOT EXISTS `points_categories` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `description` TEXT COMMENT '分类描述',
  `image` VARCHAR(255) COMMENT '分类图片',
  `parent_id` BIGINT DEFAULT 0 COMMENT '父分类ID，0为顶级分类',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分商品分类表';

-- 积分商品表
CREATE TABLE IF NOT EXISTS `points_products` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL COMMENT '商品名称',
  `description` TEXT COMMENT '商品描述',
  `image` VARCHAR(255) COMMENT '商品图片',
  `images` JSON COMMENT '商品图片列表',
  `category_id` BIGINT COMMENT '分类ID',
  `points_price` INT NOT NULL COMMENT '积分价格',
  `original_price` DECIMAL(10,2) COMMENT '原价',
  `stock` INT DEFAULT 0 COMMENT '库存数量',
  `sales_count` INT DEFAULT 0 COMMENT '销售数量',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `is_virtual` TINYINT DEFAULT 0 COMMENT '是否虚拟商品：0-实物，1-虚拟',
  `delivery_type` TINYINT DEFAULT 1 COMMENT '配送方式：1-快递，2-自提，3-虚拟发货',
  `attributes` JSON COMMENT '商品属性',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-下架，1-上架',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `points_categories`(`id`),
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sort_order` (`sort_order`),
  INDEX `idx_points_price` (`points_price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分商品表';

-- 积分订单表
CREATE TABLE IF NOT EXISTS `points_orders` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `order_no` VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `product_name` VARCHAR(200) NOT NULL COMMENT '商品名称',
  `product_image` VARCHAR(255) COMMENT '商品图片',
  `points_price` INT NOT NULL COMMENT '积分价格',
  `quantity` INT DEFAULT 1 COMMENT '数量',
  `total_points` INT NOT NULL COMMENT '总积分',
  `status` TINYINT DEFAULT 1 COMMENT '订单状态：1-待发货，2-已发货，3-已完成，4-已取消',
  `shipping_info` JSON COMMENT '收货信息',
  `tracking_number` VARCHAR(100) COMMENT '快递单号',
  `shipping_company` VARCHAR(50) COMMENT '快递公司',
  `remark` TEXT COMMENT '备注',
  `shipped_at` TIMESTAMP NULL COMMENT '发货时间',
  `completed_at` TIMESTAMP NULL COMMENT '完成时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `points_products`(`id`),
  INDEX `idx_order_no` (`order_no`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分订单表';

-- 积分规则表
CREATE TABLE IF NOT EXISTS `points_rules` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `type` VARCHAR(50) NOT NULL COMMENT '规则类型：sign_in, share, invite等',
  `points` INT NOT NULL COMMENT '奖励积分',
  `max_daily` INT DEFAULT 0 COMMENT '每日最大获得次数，0为不限制',
  `max_total` INT DEFAULT 0 COMMENT '总最大获得次数，0为不限制',
  `conditions` JSON COMMENT '触发条件',
  `description` TEXT COMMENT '规则描述',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `start_time` TIMESTAMP NULL COMMENT '开始时间',
  `end_time` TIMESTAMP NULL COMMENT '结束时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分规则表';

-- 用户积分获得记录表
CREATE TABLE IF NOT EXISTS `points_earnings` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `rule_id` BIGINT NOT NULL COMMENT '规则ID',
  `points` INT NOT NULL COMMENT '获得积分',
  `source_data` JSON COMMENT '来源数据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rule_id`) REFERENCES `points_rules`(`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_rule_id` (`rule_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户积分获得记录表';

-- 积分等级表
CREATE TABLE IF NOT EXISTS `points_levels` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `level` INT NOT NULL UNIQUE COMMENT '等级',
  `name` VARCHAR(50) NOT NULL COMMENT '等级名称',
  `min_points` INT NOT NULL COMMENT '最低积分要求',
  `max_points` INT COMMENT '最高积分要求',
  `privileges` JSON COMMENT '等级特权',
  `icon` VARCHAR(255) COMMENT '等级图标',
  `description` TEXT COMMENT '等级描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_level` (`level`),
  INDEX `idx_min_points` (`min_points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分等级表';

-- 积分兑换券表
CREATE TABLE IF NOT EXISTS `points_coupons` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '优惠券名称',
  `type` TINYINT NOT NULL COMMENT '类型：1-满减券，2-折扣券，3-免费券',
  `value` DECIMAL(10,2) NOT NULL COMMENT '面值',
  `min_amount` DECIMAL(10,2) DEFAULT 0 COMMENT '最低使用金额',
  `points_price` INT NOT NULL COMMENT '兑换所需积分',
  `total_quantity` INT NOT NULL COMMENT '总发行量',
  `used_quantity` INT DEFAULT 0 COMMENT '已使用数量',
  `per_user_limit` INT DEFAULT 1 COMMENT '每人限兑数量',
  `valid_days` INT NOT NULL COMMENT '有效天数',
  `applicable_products` JSON COMMENT '适用商品',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-下架，1-上架',
  `start_time` TIMESTAMP NULL COMMENT '开始时间',
  `end_time` TIMESTAMP NULL COMMENT '结束时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_points_price` (`points_price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分兑换券表';

-- 用户优惠券表
CREATE TABLE IF NOT EXISTS `user_coupons` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `coupon_id` BIGINT NOT NULL COMMENT '优惠券ID',
  `coupon_code` VARCHAR(50) NOT NULL UNIQUE COMMENT '优惠券码',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1-未使用，2-已使用，3-已过期',
  `used_at` TIMESTAMP NULL COMMENT '使用时间',
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`coupon_id`) REFERENCES `points_coupons`(`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_coupon_id` (`coupon_id`),
  INDEX `idx_coupon_code` (`coupon_code`),
  INDEX `idx_status` (`status`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户优惠券表';