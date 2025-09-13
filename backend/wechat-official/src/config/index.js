require('dotenv').config();

const config = {
  // 应用配置
  app: {
    name: process.env.APP_NAME || 'wechat-official-service',
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || '微信公众号服务',
  },

  // 环境配置
  env: process.env.NODE_ENV || 'development',

  // 服务器配置
  server: {
    port: parseInt(process.env.PORT, 10) || 3002,
    host: process.env.HOST || '0.0.0.0',
    bodyLimit: process.env.BODY_LIMIT || '10mb',
    timeout: parseInt(process.env.SERVER_TIMEOUT, 10) || 30000,
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'wedraw_wechat',
    dialect: 'mysql',
    charset: process.env.DB_CHARSET || 'utf8mb4',
    collate: process.env.DB_COLLATE || 'utf8mb4_unicode_ci',
    timezone: process.env.DB_TIMEZONE || '+08:00',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 1,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'wechat:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'wechat-official-service',
    audience: process.env.JWT_AUDIENCE || 'wechat-official-users',
  },

  // 微信公众号配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    token: process.env.WECHAT_TOKEN || '',
    encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY || '',
    apiBaseUrl: process.env.WECHAT_API_BASE_URL || 'https://api.weixin.qq.com',
    // 消息模板配置
    templates: {
      welcome: process.env.WECHAT_TEMPLATE_WELCOME || '',
      notification: process.env.WECHAT_TEMPLATE_NOTIFICATION || '',
      reminder: process.env.WECHAT_TEMPLATE_REMINDER || '',
    },
    // 菜单配置
    menu: {
      autoCreate: process.env.WECHAT_MENU_AUTO_CREATE === 'true',
      updateInterval: parseInt(process.env.WECHAT_MENU_UPDATE_INTERVAL, 10) || 3600000, // 1小时
    },
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 限制每个IP 15分钟内最多100个请求
  },

  // 慢速限制配置
  slowDown: {
    windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS, 10) || 15 * 60 * 1000, // 15分钟
    delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER, 10) || 50, // 50个请求后开始延迟
    delayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS, 10) || 500, // 每个请求延迟500ms
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      filename: process.env.LOG_FILE_NAME || 'logs/wechat-official-%DATE%.log',
      datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
    },
    console: {
      enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
    },
  },

  // 文件上传配置
  upload: {
    path: process.env.UPLOAD_PATH || 'uploads/',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES ? 
      process.env.UPLOAD_ALLOWED_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'video/mp4'],
  },

  // 邮件配置
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@wedraw.com',
  },

  // 短信配置
  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    provider: process.env.SMS_PROVIDER || 'aliyun',
    accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
    signName: process.env.SMS_SIGN_NAME || 'WeDraw',
    templates: {
      verification: process.env.SMS_TEMPLATE_VERIFICATION || '',
      notification: process.env.SMS_TEMPLATE_NOTIFICATION || '',
    },
  },

  // 对象存储配置
  oss: {
    enabled: process.env.OSS_ENABLED === 'true',
    provider: process.env.OSS_PROVIDER || 'aliyun',
    region: process.env.OSS_REGION || 'oss-cn-hangzhou',
    bucket: process.env.OSS_BUCKET || 'wedraw-assets',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    endpoint: process.env.OSS_ENDPOINT || '',
    cdnDomain: process.env.OSS_CDN_DOMAIN || '',
  },

  // 代理配置
  proxy: {
    enabled: process.env.PROXY_ENABLED === 'true',
    target: process.env.PROXY_TARGET || 'http://localhost:3000',
  },

  // 缓存配置
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 3600, // 1小时
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD, 10) || 600, // 10分钟
  },

  // 安全配置
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    csrfEnabled: process.env.CSRF_ENABLED === 'true',
  },

  // 监控配置
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsPath: process.env.METRICS_PATH || '/metrics',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000, // 30秒
  },
};

// 验证必需的配置
const requiredConfigs = [
  'wechat.appId',
  'wechat.appSecret',
  'wechat.token',
  'jwt.secret',
];

requiredConfigs.forEach(configPath => {
  const value = configPath.split('.').reduce((obj, key) => obj && obj[key], config);
  if (!value) {
    console.error(`Missing required configuration: ${configPath}`);
    process.exit(1);
  }
});

module.exports = config;