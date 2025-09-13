const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { redisClient } = require('../config/redis');

/**
 * 短信服务类
 * 支持多个短信服务提供商
 */
class SmsService {
  constructor() {
    this.providers = {
      aliyun: new AliyunSmsProvider(),
      tencent: new TencentSmsProvider(),
      huawei: new HuaweiSmsProvider()
    };
    
    this.currentProvider = process.env.SMS_PROVIDER || 'aliyun';
    this.templates = {
      verification: {
        aliyun: process.env.SMS_TEMPLATE_VERIFICATION_ALIYUN,
        tencent: process.env.SMS_TEMPLATE_VERIFICATION_TENCENT,
        huawei: process.env.SMS_TEMPLATE_VERIFICATION_HUAWEI
      },
      login: {
        aliyun: process.env.SMS_TEMPLATE_LOGIN_ALIYUN,
        tencent: process.env.SMS_TEMPLATE_LOGIN_TENCENT,
        huawei: process.env.SMS_TEMPLATE_LOGIN_HUAWEI
      },
      password_reset: {
        aliyun: process.env.SMS_TEMPLATE_PASSWORD_RESET_ALIYUN,
        tencent: process.env.SMS_TEMPLATE_PASSWORD_RESET_TENCENT,
        huawei: process.env.SMS_TEMPLATE_PASSWORD_RESET_HUAWEI
      }
    };
  }

  /**
   * 发送短信
   */
  async sendSms(options) {
    try {
      const {
        phone,
        template,
        params = {},
        provider = this.currentProvider
      } = options;

      // 验证手机号格式
      if (!this.validatePhone(phone)) {
        throw new Error('Invalid phone number format');
      }

      // 检查发送频率限制
      await this.checkRateLimit(phone, template);

      // 获取模板ID
      const templateId = this.templates[template]?.[provider];
      if (!templateId) {
        throw new Error(`Template '${template}' not found for provider '${provider}'`);
      }

      // 获取服务提供商实例
      const smsProvider = this.providers[provider];
      if (!smsProvider) {
        throw new Error(`SMS provider '${provider}' not supported`);
      }

      // 发送短信
      const result = await smsProvider.sendSms({
        phone,
        templateId,
        params
      });

      // 记录发送日志
      logger.info('SMS sent successfully', {
        phone: this.maskPhone(phone),
        template,
        provider,
        messageId: result.messageId
      });

      // 更新发送统计
      await this.updateSendStats(phone, template, provider, 'success');

      return {
        success: true,
        messageId: result.messageId,
        provider
      };
    } catch (error) {
      logger.error('Failed to send SMS:', {
        error: error.message,
        phone: this.maskPhone(options.phone),
        template: options.template,
        provider: options.provider || this.currentProvider
      });

      // 更新发送统计
      await this.updateSendStats(
        options.phone, 
        options.template, 
        options.provider || this.currentProvider, 
        'failed'
      );

      throw error;
    }
  }

  /**
   * 发送验证码
   */
  async sendVerificationCode(phone, type = 'verification') {
    try {
      // 生成6位数字验证码
      const code = this.generateVerificationCode();
      
      // 存储验证码到Redis（5分钟过期）
      const codeKey = `sms:code:${type}:${phone}`;
      await redisClient.setex(codeKey, 300, code);
      
      // 发送短信
      const result = await this.sendSms({
        phone,
        template: type,
        params: {
          code,
          minutes: '5'
        }
      });
      
      return {
        ...result,
        expiresIn: 300
      };
    } catch (error) {
      logger.error('Failed to send verification code:', error);
      throw error;
    }
  }

  /**
   * 验证验证码
   */
  async verifyCode(phone, code, type = 'verification') {
    try {
      const codeKey = `sms:code:${type}:${phone}`;
      const storedCode = await redisClient.get(codeKey);
      
      if (!storedCode) {
        return {
          valid: false,
          error: 'Verification code expired or not found'
        };
      }
      
      if (storedCode !== code) {
        // 记录验证失败次数
        const failKey = `sms:verify_fail:${phone}`;
        const failCount = await redisClient.incr(failKey);
        await redisClient.expire(failKey, 3600); // 1小时过期
        
        if (failCount >= 5) {
          // 删除验证码，防止暴力破解
          await redisClient.del(codeKey);
          throw new Error('Too many failed attempts, please request a new code');
        }
        
        return {
          valid: false,
          error: 'Invalid verification code',
          remainingAttempts: 5 - failCount
        };
      }
      
      // 验证成功，删除验证码和失败计数
      await redisClient.del(codeKey);
      await redisClient.del(`sms:verify_fail:${phone}`);
      
      return {
        valid: true
      };
    } catch (error) {
      logger.error('Failed to verify code:', error);
      throw error;
    }
  }

  /**
   * 生成验证码
   */
  generateVerificationCode(length = 6) {
    const digits = '0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return code;
  }

  /**
   * 验证手机号格式
   */
  validatePhone(phone) {
    // 中国大陆手机号正则
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 掩码手机号（用于日志）
   */
  maskPhone(phone) {
    if (!phone || phone.length < 7) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
  }

  /**
   * 检查发送频率限制
   */
  async checkRateLimit(phone, type) {
    try {
      const rateLimitKey = `sms:ratelimit:${type}:${phone}`;
      const count = await redisClient.get(rateLimitKey) || 0;
      
      const limits = {
        verification: { max: 5, window: 3600 }, // 1小时内最多5条验证码
        login: { max: 10, window: 3600 }, // 1小时内最多10条登录验证码
        password_reset: { max: 3, window: 3600 } // 1小时内最多3条重置密码验证码
      };
      
      const limit = limits[type] || { max: 5, window: 3600 };
      
      if (count >= limit.max) {
        throw new Error(`Rate limit exceeded for ${type} SMS`);
      }
      
      // 增加计数
      await redisClient.incr(rateLimitKey);
      await redisClient.expire(rateLimitKey, limit.window);
      
      return true;
    } catch (error) {
      logger.error('SMS rate limit check failed:', error);
      throw error;
    }
  }

  /**
   * 更新发送统计
   */
  async updateSendStats(phone, template, provider, status) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsKey = `sms:stats:${today}`;
      
      await redisClient.hincrby(statsKey, 'total', 1);
      await redisClient.hincrby(statsKey, status, 1);
      await redisClient.hincrby(statsKey, `template:${template}`, 1);
      await redisClient.hincrby(statsKey, `provider:${provider}`, 1);
      
      // 设置过期时间（保留30天）
      await redisClient.expire(statsKey, 30 * 24 * 3600);
    } catch (error) {
      logger.error('Failed to update SMS stats:', error);
    }
  }

  /**
   * 获取发送统计
   */
  async getSendStats(days = 7) {
    try {
      const stats = {};
      const today = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const statsKey = `sms:stats:${dateStr}`;
        const dayStats = await redisClient.hgetall(statsKey);
        
        stats[dateStr] = {
          total: parseInt(dayStats.total) || 0,
          success: parseInt(dayStats.success) || 0,
          failed: parseInt(dayStats.failed) || 0,
          templates: {},
          providers: {}
        };
        
        // 提取模板和提供商统计
        for (const [key, value] of Object.entries(dayStats)) {
          if (key.startsWith('template:')) {
            const templateName = key.replace('template:', '');
            stats[dateStr].templates[templateName] = parseInt(value) || 0;
          } else if (key.startsWith('provider:')) {
            const providerName = key.replace('provider:', '');
            stats[dateStr].providers[providerName] = parseInt(value) || 0;
          }
        }
      }
      
      return stats;
    } catch (error) {
      logger.error('Failed to get SMS stats:', error);
      return {};
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const results = {};
      
      for (const [name, provider] of Object.entries(this.providers)) {
        try {
          results[name] = await provider.healthCheck();
        } catch (error) {
          results[name] = {
            status: 'unhealthy',
            error: error.message
          };
        }
      }
      
      const healthyProviders = Object.values(results).filter(r => r.status === 'healthy').length;
      
      return {
        status: healthyProviders > 0 ? 'healthy' : 'unhealthy',
        currentProvider: this.currentProvider,
        providers: results,
        healthyProviders,
        totalProviders: Object.keys(this.providers).length
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

/**
 * 阿里云短信服务提供商
 */
class AliyunSmsProvider {
  constructor() {
    this.accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    this.accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    this.signName = process.env.ALIYUN_SMS_SIGN_NAME;
    this.endpoint = 'https://dysmsapi.aliyuncs.com';
  }

  async sendSms({ phone, templateId, params }) {
    try {
      const requestParams = {
        Action: 'SendSms',
        Version: '2017-05-25',
        RegionId: 'cn-hangzhou',
        PhoneNumbers: phone,
        SignName: this.signName,
        TemplateCode: templateId,
        TemplateParam: JSON.stringify(params),
        Format: 'JSON',
        Timestamp: new Date().toISOString(),
        SignatureMethod: 'HMAC-SHA1',
        SignatureVersion: '1.0',
        SignatureNonce: Math.random().toString(36).substring(2),
        AccessKeyId: this.accessKeyId
      };

      // 生成签名
      const signature = this.generateSignature(requestParams);
      requestParams.Signature = signature;

      const response = await axios.post(this.endpoint, null, {
        params: requestParams,
        timeout: 10000
      });

      if (response.data.Code === 'OK') {
        return {
          messageId: response.data.BizId,
          response: response.data
        };
      } else {
        throw new Error(`Aliyun SMS error: ${response.data.Code} - ${response.data.Message}`);
      }
    } catch (error) {
      logger.error('Aliyun SMS send failed:', error);
      throw error;
    }
  }

  generateSignature(params) {
    // 阿里云签名算法实现
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const stringToSign = `POST&${encodeURIComponent('/')}&${encodeURIComponent(sortedParams)}`;
    const signature = crypto
      .createHmac('sha1', this.accessKeySecret + '&')
      .update(stringToSign)
      .digest('base64');
    
    return signature;
  }

  async healthCheck() {
    return {
      status: this.accessKeyId && this.accessKeySecret ? 'healthy' : 'unhealthy',
      provider: 'aliyun',
      config: {
        hasCredentials: !!(this.accessKeyId && this.accessKeySecret),
        signName: this.signName
      }
    };
  }
}

/**
 * 腾讯云短信服务提供商
 */
class TencentSmsProvider {
  constructor() {
    this.secretId = process.env.TENCENT_SECRET_ID;
    this.secretKey = process.env.TENCENT_SECRET_KEY;
    this.sdkAppId = process.env.TENCENT_SMS_SDK_APP_ID;
    this.signName = process.env.TENCENT_SMS_SIGN_NAME;
    this.endpoint = 'https://sms.tencentcloudapi.com';
  }

  async sendSms({ phone, templateId, params }) {
    try {
      const payload = {
        PhoneNumberSet: [phone],
        SmsSdkAppId: this.sdkAppId,
        SignName: this.signName,
        TemplateId: templateId,
        TemplateParamSet: Object.values(params)
      };

      const headers = this.generateHeaders(payload);

      const response = await axios.post(this.endpoint, payload, {
        headers,
        timeout: 10000
      });

      if (response.data.Response.Error) {
        throw new Error(`Tencent SMS error: ${response.data.Response.Error.Code} - ${response.data.Response.Error.Message}`);
      }

      return {
        messageId: response.data.Response.SendStatusSet[0].SerialNo,
        response: response.data.Response
      };
    } catch (error) {
      logger.error('Tencent SMS send failed:', error);
      throw error;
    }
  }

  generateHeaders(payload) {
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().substring(0, 10);
    
    // 腾讯云签名算法实现（简化版）
    const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${date}/sms/tc3_request, SignedHeaders=content-type;host, Signature=placeholder`;
    
    return {
      'Content-Type': 'application/json',
      'Host': 'sms.tencentcloudapi.com',
      'Authorization': authorization,
      'X-TC-Action': 'SendSms',
      'X-TC-Version': '2021-01-11',
      'X-TC-Timestamp': timestamp.toString()
    };
  }

  async healthCheck() {
    return {
      status: this.secretId && this.secretKey ? 'healthy' : 'unhealthy',
      provider: 'tencent',
      config: {
        hasCredentials: !!(this.secretId && this.secretKey),
        sdkAppId: this.sdkAppId,
        signName: this.signName
      }
    };
  }
}

/**
 * 华为云短信服务提供商
 */
class HuaweiSmsProvider {
  constructor() {
    this.accessKey = process.env.HUAWEI_ACCESS_KEY;
    this.secretKey = process.env.HUAWEI_SECRET_KEY;
    this.sender = process.env.HUAWEI_SMS_SENDER;
    this.endpoint = process.env.HUAWEI_SMS_ENDPOINT || 'https://rtcsms.cn-north-1.myhuaweicloud.com:10743';
  }

  async sendSms({ phone, templateId, params }) {
    try {
      const payload = {
        from: this.sender,
        to: [phone],
        templateId: templateId,
        templateParas: Object.values(params)
      };

      const headers = this.generateHeaders();

      const response = await axios.post(`${this.endpoint}/sms/batchSendSms/v1`, payload, {
        headers,
        timeout: 10000
      });

      if (response.data.code !== '000000') {
        throw new Error(`Huawei SMS error: ${response.data.code} - ${response.data.description}`);
      }

      return {
        messageId: response.data.result[0].smsMsgId,
        response: response.data
      };
    } catch (error) {
      logger.error('Huawei SMS send failed:', error);
      throw error;
    }
  }

  generateHeaders() {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    
    return {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `WSSE realm="SDP",profile="UsernameToken",type="Appkey"`,
      'X-WSSE': `UsernameToken Username="${this.accessKey}",PasswordDigest="placeholder",Nonce="placeholder",Created="${timestamp}"`
    };
  }

  async healthCheck() {
    return {
      status: this.accessKey && this.secretKey ? 'healthy' : 'unhealthy',
      provider: 'huawei',
      config: {
        hasCredentials: !!(this.accessKey && this.secretKey),
        sender: this.sender
      }
    };
  }
}

// 创建短信服务实例
const smsService = new SmsService();

// 导出便捷方法
const sendSms = (options) => smsService.sendSms(options);
const sendVerificationCode = (phone, type) => smsService.sendVerificationCode(phone, type);
const verifyCode = (phone, code, type) => smsService.verifyCode(phone, code, type);
const validatePhone = (phone) => smsService.validatePhone(phone);
const getSendStats = (days) => smsService.getSendStats(days);
const healthCheck = () => smsService.healthCheck();

module.exports = {
  smsService,
  sendSms,
  sendVerificationCode,
  verifyCode,
  validatePhone,
  getSendStats,
  healthCheck
};