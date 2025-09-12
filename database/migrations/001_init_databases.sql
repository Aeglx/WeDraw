-- WeDraw 数据库初始化脚本
-- 创建所有微服务的数据库

-- 创建用户中心数据库
CREATE DATABASE IF NOT EXISTS `wedraw_user` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建公众号服务数据库
CREATE DATABASE IF NOT EXISTS `wedraw_official` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建企业微信服务数据库
CREATE DATABASE IF NOT EXISTS `wedraw_wecom` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建小程序服务数据库
CREATE DATABASE IF NOT EXISTS `wedraw_miniprogram` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建积分商城数据库
CREATE DATABASE IF NOT EXISTS `wedraw_points` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建消息中心数据库
CREATE DATABASE IF NOT EXISTS `wedraw_message` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建数据分析数据库
CREATE DATABASE IF NOT EXISTS `wedraw_analysis` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建数据库用户（可选，根据实际部署需求调整）
-- CREATE USER IF NOT EXISTS 'wedraw_user'@'%' IDENTIFIED BY 'your_password_here';
-- GRANT ALL PRIVILEGES ON wedraw_*.* TO 'wedraw_user'@'%';
-- FLUSH PRIVILEGES;