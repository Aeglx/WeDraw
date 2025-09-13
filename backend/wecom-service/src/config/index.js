require('dotenv').config();

module.exports = {
  // 环境配置
  env: process.env.NODE_ENV || 'development',
  
  // 服务器配置
  server: {
    port: process.env.PORT || 3003,
    host: process.env.HOST || '0.0.0.0',
    bodyLimit: process.env.BODY_LIMIT || '10mb',
  },
  
  // 企业微信配置
  wecom: {
    corpId: process.env.WECOM_CORP_ID,
    corpSecret: process.env.WECOM_CORP_SECRET,
    agentId: process.env.WECOM_AGENT_ID,
    token: process.env.WECOM_TOKEN,
    encodingAESKey: process.env.WECOM_ENCODING_AES_KEY,
    apiUrl: 'https://qyapi.weixin.qq.com/cgi-bin',
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'wedraw_wecom',
    dialect: 'mysql',
    timezone: '+08:00',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
  
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 2,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'wecom:',
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'wecom-service-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'wecom-service',
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:8080'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // 限制每个IP 15分钟内最多1000个请求
  },
  
  // 慢速限制配置
  slowDown: {
    windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER) || 500, // 500个请求后开始延迟
    delayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS) || 500, // 每个请求延迟500ms
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      filename: process.env.LOG_FILE_NAME || 'wecom-service-%DATE%.log',
      datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
    },
  },
  
  // 文件上传配置
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES ? process.env.UPLOAD_ALLOWED_TYPES.split(',') : [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    destination: process.env.UPLOAD_DESTINATION || './uploads',
  },
  
  // 缓存配置
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1小时
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600, // 10分钟
  },
  
  // 邮件配置
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    from: process.env.EMAIL_FROM || 'noreply@wedraw.com',
  },
  
  // 定时任务配置
  cron: {
    syncContacts: process.env.CRON_SYNC_CONTACTS || '0 */6 * * *', // 每6小时同步一次通讯录
    cleanupLogs: process.env.CRON_CLEANUP_LOGS || '0 2 * * *', // 每天凌晨2点清理日志
    updateAccessToken: process.env.CRON_UPDATE_ACCESS_TOKEN || '*/50 * * * *', // 每50分钟更新access_token
  },
  
  // 业务配置
  business: {
    // 通讯录同步配置
    contacts: {
      batchSize: parseInt(process.env.CONTACTS_BATCH_SIZE) || 100,
      maxRetries: parseInt(process.env.CONTACTS_MAX_RETRIES) || 3,
      retryDelay: parseInt(process.env.CONTACTS_RETRY_DELAY) || 1000,
    },
    
    // 消息推送配置
    message: {
      batchSize: parseInt(process.env.MESSAGE_BATCH_SIZE) || 1000,
      maxRetries: parseInt(process.env.MESSAGE_MAX_RETRIES) || 3,
      retryDelay: parseInt(process.env.MESSAGE_RETRY_DELAY) || 2000,
    },
  },
};