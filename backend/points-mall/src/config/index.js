const path = require('path');

// 从环境变量加载配置
require('dotenv').config();

const config = {
  // 应用配置
  app: {
    name: process.env.APP_NAME || 'WeDraw积分商城服务',
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || '积分商城服务 - 积分管理、商品管理、订单处理'
  },
  
  // 环境配置
  env: process.env.NODE_ENV || 'development',
  
  // 服务器配置
  server: {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT, 10) || 3004,
    timeout: parseInt(process.env.SERVER_TIMEOUT, 10) || 30000,
    keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10) || 5000
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'wedraw_points_mall',
    username: process.env.DB_USER || 'wedraw_user',
    password: process.env.DB_PASSWORD || 'wedraw_password',
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000
    },
    timezone: process.env.DB_TIMEZONE || '+08:00'
  },
  
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 1, // 使用数据库1，避免与其他服务冲突
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'points_mall:',
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 100,
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES, 10) || 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_for_points_mall',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'wedraw-points-mall',
    audience: process.env.JWT_AUDIENCE || 'wedraw-users',
    algorithm: 'HS256'
  },
  
  // CORS配置
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS 
      ? process.env.CORS_ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:3001', 'https://wedraw.com']
  },
  
  // 文件上传配置
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES 
      ? process.env.UPLOAD_ALLOWED_TYPES.split(',') 
      : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    destination: process.env.UPLOAD_DESTINATION || path.join(__dirname, '../../uploads'),
    publicPath: process.env.UPLOAD_PUBLIC_PATH || '/static'
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: process.env.LOG_FILE_ENABLED !== 'false',
      directory: process.env.LOG_DIRECTORY || path.join(__dirname, '../../logs'),
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d'
    },
    console: {
      enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
      colorize: process.env.LOG_COLORIZE !== 'false'
    }
  },
  
  // 积分系统配置
  points: {
    // 积分获取规则
    earning: {
      signIn: parseInt(process.env.POINTS_SIGN_IN, 10) || 10, // 签到积分
      purchase: parseFloat(process.env.POINTS_PURCHASE_RATE) || 0.01, // 购买积分比例（1元=1积分）
      share: parseInt(process.env.POINTS_SHARE, 10) || 5, // 分享积分
      review: parseInt(process.env.POINTS_REVIEW, 10) || 20, // 评价积分
      invite: parseInt(process.env.POINTS_INVITE, 10) || 100, // 邀请积分
      task: parseInt(process.env.POINTS_TASK, 10) || 50 // 任务积分
    },
    // 积分使用规则
    spending: {
      minAmount: parseInt(process.env.POINTS_MIN_AMOUNT, 10) || 100, // 最小使用积分
      maxRatio: parseFloat(process.env.POINTS_MAX_RATIO) || 0.5, // 最大使用比例
      exchangeRate: parseFloat(process.env.POINTS_EXCHANGE_RATE) || 1 // 积分兑换比例（1积分=1元）
    },
    // 积分过期配置
    expiration: {
      enabled: process.env.POINTS_EXPIRATION_ENABLED === 'true',
      days: parseInt(process.env.POINTS_EXPIRATION_DAYS, 10) || 365 // 积分有效期（天）
    }
  },
  
  // 商品配置
  products: {
    // 图片配置
    images: {
      maxCount: parseInt(process.env.PRODUCT_MAX_IMAGES, 10) || 10,
      maxSize: parseInt(process.env.PRODUCT_IMAGE_MAX_SIZE, 10) || 5 * 1024 * 1024, // 5MB
      thumbnailSize: {
        width: parseInt(process.env.PRODUCT_THUMBNAIL_WIDTH, 10) || 300,
        height: parseInt(process.env.PRODUCT_THUMBNAIL_HEIGHT, 10) || 300
      }
    },
    // 库存配置
    inventory: {
      lowStockThreshold: parseInt(process.env.PRODUCT_LOW_STOCK_THRESHOLD, 10) || 10,
      autoOffShelf: process.env.PRODUCT_AUTO_OFF_SHELF === 'true' // 库存为0时自动下架
    }
  },
  
  // 订单配置
  orders: {
    // 订单号配置
    orderNumber: {
      prefix: process.env.ORDER_NUMBER_PREFIX || 'PM', // Points Mall
      length: parseInt(process.env.ORDER_NUMBER_LENGTH, 10) || 16
    },
    // 订单超时配置
    timeout: {
      payment: parseInt(process.env.ORDER_PAYMENT_TIMEOUT, 10) || 30 * 60 * 1000, // 30分钟
      delivery: parseInt(process.env.ORDER_DELIVERY_TIMEOUT, 10) || 7 * 24 * 60 * 60 * 1000, // 7天
      receive: parseInt(process.env.ORDER_RECEIVE_TIMEOUT, 10) || 7 * 24 * 60 * 60 * 1000 // 7天
    },
    // 自动确认收货
    autoConfirm: {
      enabled: process.env.ORDER_AUTO_CONFIRM_ENABLED === 'true',
      days: parseInt(process.env.ORDER_AUTO_CONFIRM_DAYS, 10) || 7
    }
  },
  
  // 优惠券配置
  coupons: {
    // 优惠券码配置
    code: {
      length: parseInt(process.env.COUPON_CODE_LENGTH, 10) || 8,
      prefix: process.env.COUPON_CODE_PREFIX || 'WD'
    },
    // 使用限制
    limits: {
      maxPerUser: parseInt(process.env.COUPON_MAX_PER_USER, 10) || 10, // 每用户最多领取数量
      maxPerOrder: parseInt(process.env.COUPON_MAX_PER_ORDER, 10) || 1 // 每订单最多使用数量
    }
  },
  
  // 支付配置
  payment: {
    // 支付宝配置
    alipay: {
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
      notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
      returnUrl: process.env.ALIPAY_RETURN_URL || ''
    },
    // 微信支付配置
    wechatPay: {
      appId: process.env.WECHAT_PAY_APP_ID || '',
      mchId: process.env.WECHAT_PAY_MCH_ID || '',
      apiKey: process.env.WECHAT_PAY_API_KEY || '',
      certPath: process.env.WECHAT_PAY_CERT_PATH || '',
      keyPath: process.env.WECHAT_PAY_KEY_PATH || '',
      notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || ''
    }
  },
  
  // 代理配置（开发环境）
  proxy: {
    enabled: process.env.PROXY_ENABLED === 'true',
    target: process.env.PROXY_TARGET || 'http://localhost:3000'
  },
  
  // 缓存配置
  cache: {
    // 产品缓存
    products: {
      ttl: parseInt(process.env.CACHE_PRODUCTS_TTL, 10) || 300, // 5分钟
      maxKeys: parseInt(process.env.CACHE_PRODUCTS_MAX_KEYS, 10) || 1000
    },
    // 用户缓存
    users: {
      ttl: parseInt(process.env.CACHE_USERS_TTL, 10) || 600, // 10分钟
      maxKeys: parseInt(process.env.CACHE_USERS_MAX_KEYS, 10) || 500
    },
    // 订单缓存
    orders: {
      ttl: parseInt(process.env.CACHE_ORDERS_TTL, 10) || 180, // 3分钟
      maxKeys: parseInt(process.env.CACHE_ORDERS_MAX_KEYS, 10) || 2000
    }
  },
  
  // 定时任务配置
  cron: {
    // 积分过期检查
    pointsExpiration: process.env.CRON_POINTS_EXPIRATION || '0 2 * * *', // 每天凌晨2点
    // 订单状态检查
    orderStatus: process.env.CRON_ORDER_STATUS || '*/10 * * * *', // 每10分钟
    // 库存预警
    stockAlert: process.env.CRON_STOCK_ALERT || '0 9 * * *', // 每天上午9点
    // 数据统计
    statistics: process.env.CRON_STATISTICS || '0 1 * * *' // 每天凌晨1点
  },
  
  // 通知配置
  notifications: {
    // 邮件通知
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      host: process.env.EMAIL_HOST || '',
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASSWORD || ''
    },
    // 短信通知
    sms: {
      enabled: process.env.SMS_ENABLED === 'true',
      provider: process.env.SMS_PROVIDER || 'aliyun',
      accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || ''
    }
  }
};

// 验证必需的配置项
const requiredConfigs = [
  'database.host',
  'database.name',
  'database.username',
  'database.password',
  'redis.host',
  'jwt.secret'
];

const missingConfigs = requiredConfigs.filter(configPath => {
  const keys = configPath.split('.');
  let value = config;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined || value === null || value === '') {
      return true;
    }
  }
  
  return false;
});

if (missingConfigs.length > 0) {
  console.error('Missing required configuration:', missingConfigs);
  if (config.env === 'production') {
    process.exit(1);
  }
}

module.exports = config;