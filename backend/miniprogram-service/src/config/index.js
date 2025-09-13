/**
 * 应用配置
 */

require('dotenv').config();
const path = require('path');

module.exports = {
  // 服务配置
  server: {
    port: parseInt(process.env.PORT) || 3004,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    name: 'miniprogram-service',
    version: '1.0.0'
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'miniprogram_service',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+08:00',
    logging: process.env.DB_LOGGING === 'true'
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'miniprogram:',
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'miniprogram-service-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'miniprogram-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'miniprogram-service',
    audience: 'miniprogram-client'
  },

  // 微信小程序配置
  wechat: {
    miniprogram: {
      appId: process.env.WX_MINIPROGRAM_APP_ID || '',
      appSecret: process.env.WX_MINIPROGRAM_APP_SECRET || '',
      token: process.env.WX_MINIPROGRAM_TOKEN || '',
      encodingAESKey: process.env.WX_MINIPROGRAM_ENCODING_AES_KEY || '',
      version: process.env.MINIPROGRAM_VERSION || '1.0.0',
      env: process.env.MINIPROGRAM_ENV || 'develop',
      debug: process.env.MINIPROGRAM_DEBUG === 'true'
    },
    pay: {
      mchId: process.env.WX_PAY_MCH_ID || '',
      key: process.env.WX_PAY_KEY || '',
      certPath: process.env.WX_PAY_CERT_PATH || './certs/apiclient_cert.pem',
      keyPath: process.env.WX_PAY_KEY_PATH || './certs/apiclient_key.pem',
      notifyUrl: process.env.WX_PAY_NOTIFY_URL || '/api/pay/notify'
    }
  },

  // 文件上传配置
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
    tempPath: path.join(process.cwd(), 'temp'),
    staticPath: '/uploads'
  },

  // 消息推送配置
  push: {
    templates: {
      welcome: process.env.PUSH_TEMPLATE_ID_WELCOME || '',
      order: process.env.PUSH_TEMPLATE_ID_ORDER || '',
      activity: process.env.PUSH_TEMPLATE_ID_ACTIVITY || '',
      system: process.env.PUSH_TEMPLATE_ID_SYSTEM || ''
    },
    batchSize: parseInt(process.env.MESSAGE_BATCH_SIZE) || 100,
    retryTimes: parseInt(process.env.MESSAGE_RETRY_TIMES) || 3,
    retryDelay: parseInt(process.env.MESSAGE_RETRY_DELAY) || 5000
  },

  // 短信配置
  sms: {
    accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
    signName: process.env.SMS_SIGN_NAME || '',
    templateCode: {
      verify: process.env.SMS_TEMPLATE_CODE_VERIFY || ''
    }
  },

  // 邮件配置
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    },
    from: process.env.EMAIL_FROM || 'WeDraw <noreply@wedraw.com>'
  },

  // 七牛云配置
  qiniu: {
    accessKey: process.env.QINIU_ACCESS_KEY || '',
    secretKey: process.env.QINIU_SECRET_KEY || '',
    bucket: process.env.QINIU_BUCKET || '',
    domain: process.env.QINIU_DOMAIN || ''
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD'
  },

  // 缓存配置
  cache: {
    ttl: {
      default: parseInt(process.env.CACHE_TTL_DEFAULT) || 3600,
      userInfo: parseInt(process.env.CACHE_TTL_USER_INFO) || 1800,
      accessToken: parseInt(process.env.CACHE_TTL_ACCESS_TOKEN) || 7200,
      session: parseInt(process.env.CACHE_TTL_SESSION) || 86400
    }
  },

  // 安全配置
  security: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    apiKeys: (process.env.API_KEYS || '').split(',').filter(key => key),
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key-32-chars-long',
    hashSaltRounds: parseInt(process.env.HASH_SALT_ROUNDS) || 12
  },

  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS_REQUESTS === 'true'
  },

  // 监控配置
  monitor: {
    enabled: process.env.MONITOR_ENABLED === 'true',
    path: process.env.MONITOR_PATH || '/status',
    title: process.env.MONITOR_TITLE || '小程序服务监控'
  },

  // 定时任务配置
  cron: {
    enabled: process.env.CRON_ENABLED === 'true',
    jobs: {
      cleanLogs: process.env.CRON_CLEAN_LOGS || '0 2 * * *',
      syncUserData: process.env.CRON_SYNC_USER_DATA || '0 */6 * * *',
      sendNotifications: process.env.CRON_SEND_NOTIFICATIONS || '*/5 * * * *'
    }
  },

  // 外部服务配置
  services: {
    userCenter: process.env.USER_CENTER_URL || 'http://localhost:3001',
    apiGateway: process.env.API_GATEWAY_URL || 'http://localhost:3000',
    weworkService: process.env.WEWORK_SERVICE_URL || 'http://localhost:3003'
  },

  // 用户配置
  user: {
    defaultAvatar: process.env.USER_DEFAULT_AVATAR || 'https://example.com/default-avatar.png',
    maxNicknameLength: parseInt(process.env.USER_MAX_NICKNAME_LENGTH) || 20,
    sessionTimeout: parseInt(process.env.USER_SESSION_TIMEOUT) || 86400
  },

  // 消息配置
  message: {
    maxLength: parseInt(process.env.MESSAGE_MAX_LENGTH) || 500,
    batchSize: parseInt(process.env.MESSAGE_BATCH_SIZE) || 100,
    retryTimes: parseInt(process.env.MESSAGE_RETRY_TIMES) || 3,
    retryDelay: parseInt(process.env.MESSAGE_RETRY_DELAY) || 5000
  },

  // 统计配置
  stats: {
    enabled: process.env.STATS_ENABLED === 'true',
    retentionDays: parseInt(process.env.STATS_RETENTION_DAYS) || 90,
    batchSize: parseInt(process.env.STATS_BATCH_SIZE) || 1000
  },

  // 开发配置
  development: {
    debug: process.env.DEBUG || 'miniprogram:*',
    colors: process.env.DEBUG_COLORS === 'true',
    hideDate: process.env.DEBUG_HIDE_DATE === 'true'
  },

  // 性能配置
  performance: {
    cluster: {
      enabled: process.env.CLUSTER_ENABLED === 'true',
      workers: parseInt(process.env.CLUSTER_WORKERS) || 0
    },
    keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 5000,
    headersTimeout: parseInt(process.env.HEADERS_TIMEOUT) || 60000
  }
};