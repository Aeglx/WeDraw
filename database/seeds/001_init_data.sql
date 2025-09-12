-- WeDraw 初始化种子数据

-- 用户中心初始数据
USE `wedraw_user`;

-- 插入默认管理员角色
INSERT INTO `user_roles` (`name`, `description`, `permissions`, `status`) VALUES
('super_admin', '超级管理员', JSON_ARRAY('*'), 1),
('admin', '管理员', JSON_ARRAY('user:read', 'user:write', 'official:read', 'official:write', 'wecom:read', 'wecom:write', 'miniprogram:read', 'miniprogram:write', 'points:read', 'points:write', 'message:read', 'message:write', 'analysis:read'), 1),
('operator', '运营人员', JSON_ARRAY('official:read', 'official:write', 'wecom:read', 'wecom:write', 'miniprogram:read', 'miniprogram:write', 'points:read', 'points:write', 'message:read', 'message:write'), 1),
('viewer', '查看者', JSON_ARRAY('official:read', 'wecom:read', 'miniprogram:read', 'points:read', 'message:read', 'analysis:read'), 1);

-- 插入默认管理员用户（密码：admin123）
INSERT INTO `users` (`username`, `email`, `password_hash`, `nickname`, `status`) VALUES
('admin', 'admin@wedraw.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTGJmKWNbLNWHp8Y6jd6UKrOKWOqTtqC', '系统管理员', 1);

-- 关联管理员用户和超级管理员角色
INSERT INTO `user_role_relations` (`user_id`, `role_id`) VALUES
(1, 1);

-- 插入管理员用户扩展信息
INSERT INTO `user_profiles` (`user_id`, `real_name`, `company`, `position`, `bio`) VALUES
(1, '系统管理员', 'WeDraw', '系统管理员', '系统默认管理员账户');

-- 消息中心初始数据
USE `wedraw_message`;

-- 插入默认消息模板
INSERT INTO `message_templates` (`name`, `type`, `title`, `content`, `variables`, `status`) VALUES
('用户注册欢迎', 'system', '欢迎加入WeDraw', '亲爱的{{nickname}}，欢迎您加入WeDraw！我们为您提供优质的服务体验。', JSON_OBJECT('nickname', '用户昵称'), 1),
('积分获得通知', 'system', '积分获得通知', '恭喜您获得{{points}}积分！来源：{{source}}', JSON_OBJECT('points', '积分数量', 'source', '积分来源'), 1),
('订单发货通知', 'system', '您的订单已发货', '您的订单{{orderNo}}已发货，快递单号：{{trackingNumber}}，请注意查收。', JSON_OBJECT('orderNo', '订单号', 'trackingNumber', '快递单号'), 1),
('密码重置', 'email', '密码重置验证码', '您的密码重置验证码是：{{code}}，有效期5分钟，请勿泄露给他人。', JSON_OBJECT('code', '验证码'), 1),
('登录验证码', 'sms', '登录验证码', '您的登录验证码是{{code}}，有效期5分钟。【WeDraw】', JSON_OBJECT('code', '验证码'), 1);

-- 积分商城初始数据
USE `wedraw_points`;

-- 插入积分等级
INSERT INTO `points_levels` (`level`, `name`, `min_points`, `max_points`, `privileges`, `description`) VALUES
(1, '青铜会员', 0, 999, JSON_ARRAY('基础兑换'), '新手等级，享受基础兑换权益'),
(2, '白银会员', 1000, 4999, JSON_ARRAY('基础兑换', '优先客服'), '白银等级，享受优先客服服务'),
(3, '黄金会员', 5000, 19999, JSON_ARRAY('基础兑换', '优先客服', '专属活动'), '黄金等级，可参与专属活动'),
(4, '铂金会员', 20000, 49999, JSON_ARRAY('基础兑换', '优先客服', '专属活动', '生日特权'), '铂金等级，享受生日特权'),
(5, '钻石会员', 50000, NULL, JSON_ARRAY('基础兑换', '优先客服', '专属活动', '生日特权', '专属客服'), '钻石等级，享受专属客服服务');

-- 插入商品分类
INSERT INTO `points_categories` (`name`, `description`, `parent_id`, `sort_order`, `status`) VALUES
('数码产品', '各类数码电子产品', 0, 1, 1),
('生活用品', '日常生活必需品', 0, 2, 1),
('美食饮品', '各类美食和饮品', 0, 3, 1),
('图书文具', '图书和办公文具', 0, 4, 1),
('虚拟商品', '虚拟类商品和服务', 0, 5, 1),
('手机配件', '手机相关配件', 1, 1, 1),
('电脑配件', '电脑相关配件', 1, 2, 1),
('家居用品', '家庭日用品', 2, 1, 1),
('个护用品', '个人护理用品', 2, 2, 1);

-- 插入积分规则
INSERT INTO `points_rules` (`name`, `type`, `points`, `max_daily`, `max_total`, `conditions`, `description`, `status`) VALUES
('每日签到', 'sign_in', 10, 1, 0, JSON_OBJECT('consecutive_days', 7, 'bonus_points', 50), '每日签到获得10积分，连续7天额外获得50积分', 1),
('分享内容', 'share', 5, 3, 0, JSON_OBJECT('platforms', JSON_ARRAY('wechat', 'weibo')), '分享内容到社交平台获得5积分，每日最多3次', 1),
('邀请好友', 'invite', 100, 0, 0, JSON_OBJECT('min_activity_days', 3), '邀请好友注册并活跃3天获得100积分', 1),
('完善资料', 'profile_complete', 50, 0, 1, JSON_OBJECT('required_fields', JSON_ARRAY('avatar', 'nickname', 'phone')), '完善个人资料获得50积分，仅限一次', 1),
('首次购买', 'first_purchase', 200, 0, 1, JSON_OBJECT('min_amount', 100), '首次购买满100元获得200积分', 1);

-- 插入示例商品
INSERT INTO `points_products` (`name`, `description`, `category_id`, `points_price`, `original_price`, `stock`, `is_virtual`, `delivery_type`, `status`) VALUES
('无线蓝牙耳机', '高品质无线蓝牙耳机，音质清晰，续航持久', 6, 2000, 199.00, 100, 0, 1, 1),
('便携充电宝', '10000mAh大容量充电宝，支持快充', 6, 1500, 129.00, 200, 0, 1, 1),
('咖啡券', '星巴克中杯咖啡券，全国门店通用', 3, 500, 35.00, 1000, 1, 3, 1),
('图书券', '当当网50元图书券', 4, 450, 50.00, 500, 1, 3, 1),
('会员月卡', '平台会员月卡，享受专属权益', 5, 300, 30.00, 0, 1, 3, 1);

-- 插入优惠券
INSERT INTO `points_coupons` (`name`, `type`, `value`, `min_amount`, `points_price`, `total_quantity`, `per_user_limit`, `valid_days`, `status`) VALUES
('满100减10券', 1, 10.00, 100.00, 100, 1000, 2, 30, 1),
('9折优惠券', 2, 0.90, 50.00, 150, 500, 1, 30, 1),
('免邮券', 3, 15.00, 0.00, 50, 2000, 5, 15, 1);

-- 数据分析初始数据
USE `wedraw_analysis`;

-- 插入示例统计数据（最近7天）
INSERT INTO `user_statistics` (`date`, `platform`, `new_users`, `active_users`, `total_users`) VALUES
(CURDATE() - INTERVAL 6 DAY, 'official', 15, 120, 1500),
(CURDATE() - INTERVAL 5 DAY, 'official', 18, 135, 1518),
(CURDATE() - INTERVAL 4 DAY, 'official', 22, 142, 1540),
(CURDATE() - INTERVAL 3 DAY, 'official', 12, 128, 1552),
(CURDATE() - INTERVAL 2 DAY, 'official', 25, 156, 1577),
(CURDATE() - INTERVAL 1 DAY, 'official', 19, 148, 1596),
(CURDATE(), 'official', 8, 89, 1604),
(CURDATE() - INTERVAL 6 DAY, 'miniprogram', 25, 200, 2000),
(CURDATE() - INTERVAL 5 DAY, 'miniprogram', 32, 218, 2032),
(CURDATE() - INTERVAL 4 DAY, 'miniprogram', 28, 225, 2060),
(CURDATE() - INTERVAL 3 DAY, 'miniprogram', 35, 240, 2095),
(CURDATE() - INTERVAL 2 DAY, 'miniprogram', 41, 268, 2136),
(CURDATE() - INTERVAL 1 DAY, 'miniprogram', 38, 255, 2174),
(CURDATE(), 'miniprogram', 15, 180, 2189);

INSERT INTO `points_statistics` (`date`, `total_issued`, `total_consumed`, `total_orders`, `total_amount`) VALUES
(CURDATE() - INTERVAL 6 DAY, 1500, 800, 25, 2500.00),
(CURDATE() - INTERVAL 5 DAY, 1800, 950, 32, 3200.00),
(CURDATE() - INTERVAL 4 DAY, 2200, 1200, 28, 2800.00),
(CURDATE() - INTERVAL 3 DAY, 1200, 600, 18, 1800.00),
(CURDATE() - INTERVAL 2 DAY, 2500, 1500, 45, 4500.00),
(CURDATE() - INTERVAL 1 DAY, 1900, 1100, 38, 3800.00),
(CURDATE(), 800, 400, 12, 1200.00);