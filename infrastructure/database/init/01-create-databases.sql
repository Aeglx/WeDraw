-- WeDraw 数据库初始化脚本
-- 创建各个微服务的数据库

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 用户中心数据库
CREATE DATABASE IF NOT EXISTS `wedraw_user_center` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 企业微信服务数据库
CREATE DATABASE IF NOT EXISTS `wedraw_wework` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 小程序服务数据库
CREATE DATABASE IF NOT EXISTS `wedraw_miniprogram` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 公众号服务数据库
CREATE DATABASE IF NOT EXISTS `wedraw_wechat` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 积分商城服务数据库
CREATE DATABASE IF NOT EXISTS `wedraw_points_mall` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 消息中心服务数据库
CREATE DATABASE IF NOT EXISTS `wedraw_message_center` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- API网关数据库（用于存储路由配置、限流规则等）
CREATE DATABASE IF NOT EXISTS `wedraw_api_gateway` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 监控和日志数据库
CREATE DATABASE IF NOT EXISTS `wedraw_monitoring` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建服务专用用户
-- 用户中心服务用户
CREATE USER IF NOT EXISTS 'wedraw_user'@'%' IDENTIFIED BY 'wedraw_user_123';
GRANT ALL PRIVILEGES ON `wedraw_user_center`.* TO 'wedraw_user'@'%';

-- 企业微信服务用户
CREATE USER IF NOT EXISTS 'wedraw_wework'@'%' IDENTIFIED BY 'wedraw_wework_123';
GRANT ALL PRIVILEGES ON `wedraw_wework`.* TO 'wedraw_wework'@'%';

-- 小程序服务用户
CREATE USER IF NOT EXISTS 'wedraw_mini'@'%' IDENTIFIED BY 'wedraw_mini_123';
GRANT ALL PRIVILEGES ON `wedraw_miniprogram`.* TO 'wedraw_mini'@'%';

-- 公众号服务用户
CREATE USER IF NOT EXISTS 'wedraw_wechat'@'%' IDENTIFIED BY 'wedraw_wechat_123';
GRANT ALL PRIVILEGES ON `wedraw_wechat`.* TO 'wedraw_wechat'@'%';

-- 积分商城服务用户
CREATE USER IF NOT EXISTS 'wedraw_points'@'%' IDENTIFIED BY 'wedraw_points_123';
GRANT ALL PRIVILEGES ON `wedraw_points_mall`.* TO 'wedraw_points'@'%';

-- 消息中心服务用户
CREATE USER IF NOT EXISTS 'wedraw_message'@'%' IDENTIFIED BY 'wedraw_message_123';
GRANT ALL PRIVILEGES ON `wedraw_message_center`.* TO 'wedraw_message'@'%';

-- API网关服务用户
CREATE USER IF NOT EXISTS 'wedraw_gateway'@'%' IDENTIFIED BY 'wedraw_gateway_123';
GRANT ALL PRIVILEGES ON `wedraw_api_gateway`.* TO 'wedraw_gateway'@'%';

-- 监控服务用户
CREATE USER IF NOT EXISTS 'wedraw_monitor'@'%' IDENTIFIED BY 'wedraw_monitor_123';
GRANT ALL PRIVILEGES ON `wedraw_monitoring`.* TO 'wedraw_monitor'@'%';

-- 通用服务用户（用于跨服务查询）
CREATE USER IF NOT EXISTS 'wedraw_common'@'%' IDENTIFIED BY 'wedraw_common_123';
GRANT SELECT ON `wedraw_user_center`.* TO 'wedraw_common'@'%';
GRANT SELECT ON `wedraw_wework`.* TO 'wedraw_common'@'%';
GRANT SELECT ON `wedraw_miniprogram`.* TO 'wedraw_common'@'%';
GRANT SELECT ON `wedraw_wechat`.* TO 'wedraw_common'@'%';
GRANT SELECT ON `wedraw_points_mall`.* TO 'wedraw_common'@'%';
GRANT SELECT ON `wedraw_message_center`.* TO 'wedraw_common'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示创建的数据库
SHOW DATABASES LIKE 'wedraw_%';

-- 显示创建的用户
SELECT User, Host FROM mysql.user WHERE User LIKE 'wedraw_%';

-- 记录初始化完成时间
INSERT INTO mysql.general_log (event_time, user_host, thread_id, server_id, command_type, argument) 
VALUES (NOW(), 'init_script', 0, 1, 'Init', 'WeDraw databases and users created successfully');

SELECT 'WeDraw 数据库初始化完成！' as message;
SELECT NOW() as initialized_at;