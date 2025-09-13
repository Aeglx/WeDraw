const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../utils/logger');
const { redisClient } = require('../config/redis');

/**
 * 邮件服务类
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.initialized = false;
    
    this.init();
  }

  /**
   * 初始化邮件服务
   */
  async init() {
    try {
      // 创建邮件传输器
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        pool: true, // 使用连接池
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 14, // 每秒最多发送14封邮件
        rateDelta: 1000 // 1秒
      });

      // 验证SMTP连接
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');

      // 预加载邮件模板
      await this.loadTemplates();
      
      this.initialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * 加载邮件模板
   */
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      
      // 确保模板目录存在
      try {
        await fs.access(templatesDir);
      } catch {
        // 如果目录不存在，创建默认模板
        await this.createDefaultTemplates(templatesDir);
      }

      const templateFiles = await fs.readdir(templatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.hbs') || file.endsWith('.handlebars')) {
          const templateName = path.basename(file, path.extname(file));
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          
          // 编译模板
          const compiledTemplate = handlebars.compile(templateContent);
          this.templates.set(templateName, compiledTemplate);
          
          logger.debug(`Loaded email template: ${templateName}`);
        }
      }
      
      logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('Failed to load email templates:', error);
    }
  }

  /**
   * 创建默认邮件模板
   */
  async createDefaultTemplates(templatesDir) {
    try {
      await fs.mkdir(templatesDir, { recursive: true });
      
      const defaultTemplates = {
        'email-verification': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Verification - WeDraw</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to WeDraw!</h1>
        </div>
        <div class="content">
            <h2>Hi {{username}},</h2>
            <p>Thank you for registering with WeDraw. To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="{{verificationUrl}}">{{verificationUrl}}</a></p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with WeDraw, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 WeDraw. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,

        'password-reset': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - WeDraw</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hi {{username}},</h2>
            <p>We received a request to reset your password for your WeDraw account.</p>
            <div class="warning">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </div>
            <p>To reset your password, click the button below:</p>
            <p style="text-align: center;">
                <a href="{{resetUrl}}" class="button">Reset Password</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="{{resetUrl}}">{{resetUrl}}</a></p>
            <p>This password reset link will expire in {{expiresIn}}.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 WeDraw. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,

        'welcome': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to WeDraw!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to WeDraw!</h1>
        </div>
        <div class="content">
            <h2>Hi {{username}},</h2>
            <p>Congratulations! Your email has been verified and your WeDraw account is now active.</p>
            <p>Here's what you can do with WeDraw:</p>
            <div class="feature">
                <h3>🎨 Create and Share</h3>
                <p>Create beautiful drawings and share them with the community.</p>
            </div>
            <div class="feature">
                <h3>👥 Connect</h3>
                <p>Follow other artists and discover amazing artwork.</p>
            </div>
            <div class="feature">
                <h3>💬 Collaborate</h3>
                <p>Join collaborative projects and work together with other creators.</p>
            </div>
            <p style="text-align: center;">
                <a href="{{appUrl}}" class="button">Start Creating</a>
            </p>
        </div>
        <div class="footer">
            <p>&copy; 2024 WeDraw. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
      };

      for (const [templateName, templateContent] of Object.entries(defaultTemplates)) {
        const templatePath = path.join(templatesDir, `${templateName}.hbs`);
        await fs.writeFile(templatePath, templateContent.trim());
        logger.info(`Created default template: ${templateName}`);
      }
    } catch (error) {
      logger.error('Failed to create default templates:', error);
    }
  }

  /**
   * 发送邮件
   */
  async sendEmail(options) {
    try {
      if (!this.initialized) {
        throw new Error('Email service not initialized');
      }

      const {
        to,
        subject,
        template,
        data = {},
        html,
        text,
        attachments = [],
        priority = 'normal'
      } = options;

      let emailHtml = html;
      let emailText = text;

      // 如果指定了模板，使用模板渲染
      if (template) {
        const compiledTemplate = this.templates.get(template);
        if (!compiledTemplate) {
          throw new Error(`Email template '${template}' not found`);
        }
        
        emailHtml = compiledTemplate(data);
        
        // 生成纯文本版本（简单的HTML到文本转换）
        if (!emailText) {
          emailText = emailHtml
            .replace(/<[^>]*>/g, '') // 移除HTML标签
            .replace(/\s+/g, ' ') // 合并空白字符
            .trim();
        }
      }

      // 构建邮件选项
      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'WeDraw',
          address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        },
        to,
        subject,
        html: emailHtml,
        text: emailText,
        attachments,
        priority: priority === 'high' ? 'high' : 'normal',
        headers: {
          'X-Mailer': 'WeDraw Email Service',
          'X-Priority': priority === 'high' ? '1' : '3'
        }
      };

      // 发送邮件
      const result = await this.transporter.sendMail(mailOptions);
      
      // 记录发送日志
      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to,
        subject,
        template
      });

      // 更新发送统计
      await this.updateSendStats(to, template, 'success');

      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      logger.error('Failed to send email:', {
        error: error.message,
        to: options.to,
        subject: options.subject,
        template: options.template
      });

      // 更新发送统计
      await this.updateSendStats(options.to, options.template, 'failed');

      throw error;
    }
  }

  /**
   * 批量发送邮件
   */
  async sendBulkEmails(emails) {
    const results = [];
    const batchSize = 10; // 每批处理10封邮件
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(async (emailOptions) => {
        try {
          const result = await this.sendEmail(emailOptions);
          return { ...result, email: emailOptions.to };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            email: emailOptions.to
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 批次间延迟，避免过快发送
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    logger.info('Bulk email sending completed', {
      total: results.length,
      success: successCount,
      failed: failedCount
    });
    
    return {
      total: results.length,
      success: successCount,
      failed: failedCount,
      results
    };
  }

  /**
   * 更新发送统计
   */
  async updateSendStats(to, template, status) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsKey = `email:stats:${today}`;
      
      await redisClient.hset(statsKey, 'total', 
        await redisClient.hget(statsKey, 'total') || 0 + 1
      );
      
      await redisClient.hset(statsKey, status, 
        await redisClient.hget(statsKey, status) || 0 + 1
      );
      
      if (template) {
        await redisClient.hset(statsKey, `template:${template}`, 
          await redisClient.hget(statsKey, `template:${template}`) || 0 + 1
        );
      }
      
      // 设置过期时间（保留30天）
      await redisClient.expire(statsKey, 30 * 24 * 3600);
    } catch (error) {
      logger.error('Failed to update email stats:', error);
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
        
        const statsKey = `email:stats:${dateStr}`;
        const dayStats = await redisClient.hgetall(statsKey);
        
        stats[dateStr] = {
          total: parseInt(dayStats.total) || 0,
          success: parseInt(dayStats.success) || 0,
          failed: parseInt(dayStats.failed) || 0,
          templates: {}
        };
        
        // 提取模板统计
        for (const [key, value] of Object.entries(dayStats)) {
          if (key.startsWith('template:')) {
            const templateName = key.replace('template:', '');
            stats[dateStr].templates[templateName] = parseInt(value) || 0;
          }
        }
      }
      
      return stats;
    } catch (error) {
      logger.error('Failed to get email stats:', error);
      return {};
    }
  }

  /**
   * 验证邮箱地址格式
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 检查邮件发送频率限制
   */
  async checkRateLimit(email, type = 'general') {
    try {
      const rateLimitKey = `email:ratelimit:${type}:${email}`;
      const count = await redisClient.get(rateLimitKey) || 0;
      
      const limits = {
        general: { max: 10, window: 3600 }, // 1小时内最多10封
        verification: { max: 3, window: 3600 }, // 1小时内最多3封验证邮件
        password_reset: { max: 3, window: 3600 } // 1小时内最多3封重置邮件
      };
      
      const limit = limits[type] || limits.general;
      
      if (count >= limit.max) {
        throw new Error(`Rate limit exceeded for ${type} emails`);
      }
      
      // 增加计数
      await redisClient.incr(rateLimitKey);
      await redisClient.expire(rateLimitKey, limit.window);
      
      return true;
    } catch (error) {
      logger.error('Rate limit check failed:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      if (!this.initialized) {
        return {
          status: 'unhealthy',
          error: 'Email service not initialized'
        };
      }
      
      // 验证SMTP连接
      await this.transporter.verify();
      
      return {
        status: 'healthy',
        templates: this.templates.size,
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === 'true'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * 关闭邮件服务
   */
  async close() {
    try {
      if (this.transporter) {
        this.transporter.close();
        logger.info('Email service closed');
      }
    } catch (error) {
      logger.error('Error closing email service:', error);
    }
  }
}

// 创建邮件服务实例
const emailService = new EmailService();

// 导出便捷方法
const sendEmail = (options) => emailService.sendEmail(options);
const sendBulkEmails = (emails) => emailService.sendBulkEmails(emails);
const getSendStats = (days) => emailService.getSendStats(days);
const checkRateLimit = (email, type) => emailService.checkRateLimit(email, type);
const validateEmail = (email) => emailService.validateEmail(email);
const healthCheck = () => emailService.healthCheck();

module.exports = {
  emailService,
  sendEmail,
  sendBulkEmails,
  getSendStats,
  checkRateLimit,
  validateEmail,
  healthCheck
};