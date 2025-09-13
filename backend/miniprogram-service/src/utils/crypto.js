const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('./errors');

/**
 * 密码哈希工具
 */
const password = {
  /**
   * 哈希密码
   */
  async hash(plainPassword, saltRounds = 12) {
    try {
      return await bcrypt.hash(plainPassword, saltRounds);
    } catch (error) {
      throw new AppError('密码哈希失败', 500, 'PASSWORD_HASH_ERROR');
    }
  },
  
  /**
   * 验证密码
   */
  async verify(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new AppError('密码验证失败', 500, 'PASSWORD_VERIFY_ERROR');
    }
  },
  
  /**
   * 生成随机密码
   */
  generate(length = 12, includeSymbols = true) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let charset = lowercase + uppercase + numbers;
    if (includeSymbols) {
      charset += symbols;
    }
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  },
  
  /**
   * 检查密码强度
   */
  checkStrength(password) {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    let strength = 'weak';
    if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'medium';
    
    return {
      score,
      strength,
      checks,
      suggestions: this.getPasswordSuggestions(checks)
    };
  },
  
  /**
   * 获取密码建议
   */
  getPasswordSuggestions(checks) {
    const suggestions = [];
    
    if (!checks.length) suggestions.push('密码长度至少8位');
    if (!checks.lowercase) suggestions.push('包含小写字母');
    if (!checks.uppercase) suggestions.push('包含大写字母');
    if (!checks.numbers) suggestions.push('包含数字');
    if (!checks.symbols) suggestions.push('包含特殊字符');
    
    return suggestions;
  }
};

/**
 * JWT令牌工具
 */
const token = {
  /**
   * 生成访问令牌
   */
  generateAccessToken(payload, expiresIn = config.jwt.expiresIn) {
    try {
      return jwt.sign(payload, config.jwt.secret, {
        expiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });
    } catch (error) {
      throw new AppError('令牌生成失败', 500, 'TOKEN_GENERATION_ERROR');
    }
  },
  
  /**
   * 生成刷新令牌
   */
  generateRefreshToken(payload, expiresIn = config.jwt.refreshExpiresIn) {
    try {
      return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });
    } catch (error) {
      throw new AppError('刷新令牌生成失败', 500, 'REFRESH_TOKEN_GENERATION_ERROR');
    }
  },
  
  /**
   * 验证访问令牌
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('访问令牌已过期', 401, 'TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('无效的访问令牌', 401, 'TOKEN_INVALID');
      }
      throw new AppError('令牌验证失败', 401, 'TOKEN_VERIFICATION_ERROR');
    }
  },
  
  /**
   * 验证刷新令牌
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('刷新令牌已过期', 401, 'REFRESH_TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('无效的刷新令牌', 401, 'REFRESH_TOKEN_INVALID');
      }
      throw new AppError('刷新令牌验证失败', 401, 'REFRESH_TOKEN_VERIFICATION_ERROR');
    }
  },
  
  /**
   * 解码令牌（不验证）
   */
  decode(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      throw new AppError('令牌解码失败', 400, 'TOKEN_DECODE_ERROR');
    }
  },
  
  /**
   * 获取令牌过期时间
   */
  getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded.exp ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  },
  
  /**
   * 检查令牌是否即将过期
   */
  isTokenExpiringSoon(token, thresholdMinutes = 15) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return false;
    
    const now = new Date();
    const threshold = new Date(now.getTime() + thresholdMinutes * 60 * 1000);
    
    return expiration <= threshold;
  }
};

/**
 * 数据加密工具
 */
const encryption = {
  /**
   * AES加密
   */
  encrypt(text, key = config.encryption.key) {
    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new AppError('数据加密失败', 500, 'ENCRYPTION_ERROR');
    }
  },
  
  /**
   * AES解密
   */
  decrypt(encryptedData, key = config.encryption.key) {
    try {
      const algorithm = 'aes-256-gcm';
      const decipher = crypto.createDecipher(algorithm, key);
      
      if (encryptedData.authTag) {
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      }
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new AppError('数据解密失败', 500, 'DECRYPTION_ERROR');
    }
  },
  
  /**
   * 简单加密（用于非敏感数据）
   */
  simpleEncrypt(text, key = config.encryption.simpleKey) {
    try {
      const cipher = crypto.createCipher('aes192', key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      throw new AppError('简单加密失败', 500, 'SIMPLE_ENCRYPTION_ERROR');
    }
  },
  
  /**
   * 简单解密
   */
  simpleDecrypt(encryptedText, key = config.encryption.simpleKey) {
    try {
      const decipher = crypto.createDecipher('aes192', key);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new AppError('简单解密失败', 500, 'SIMPLE_DECRYPTION_ERROR');
    }
  }
};

/**
 * 哈希工具
 */
const hash = {
  /**
   * MD5哈希
   */
  md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  },
  
  /**
   * SHA256哈希
   */
  sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  },
  
  /**
   * SHA512哈希
   */
  sha512(text) {
    return crypto.createHash('sha512').update(text).digest('hex');
  },
  
  /**
   * HMAC哈希
   */
  hmac(text, key, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, key).update(text).digest('hex');
  },
  
  /**
   * 文件哈希
   */
  async fileHash(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
      const fs = require('fs');
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
};

/**
 * 随机数生成工具
 */
const random = {
  /**
   * 生成随机字符串
   */
  string(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  },
  
  /**
   * 生成随机数字
   */
  number(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  /**
   * 生成UUID
   */
  uuid() {
    return crypto.randomUUID();
  },
  
  /**
   * 生成随机字节
   */
  bytes(size = 32) {
    return crypto.randomBytes(size);
  },
  
  /**
   * 生成随机十六进制字符串
   */
  hex(length = 32) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  },
  
  /**
   * 生成随机Base64字符串
   */
  base64(length = 32) {
    return crypto.randomBytes(Math.ceil(length * 3 / 4)).toString('base64').slice(0, length);
  }
};

/**
 * 微信数据解密工具
 */
const wechat = {
  /**
   * 解密微信小程序数据
   */
  decryptData(encryptedData, iv, sessionKey) {
    try {
      const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(sessionKey, 'base64'), Buffer.from(iv, 'base64'));
      decipher.setAutoPadding(true);
      
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      const decryptedData = JSON.parse(decrypted);
      
      // 验证水印
      if (decryptedData.watermark && decryptedData.watermark.appid !== config.wechat.appId) {
        throw new Error('水印验证失败');
      }
      
      return decryptedData;
    } catch (error) {
      throw new AppError('微信数据解密失败', 400, 'WECHAT_DECRYPT_ERROR');
    }
  },
  
  /**
   * 验证微信签名
   */
  verifySignature(signature, timestamp, nonce, token) {
    const tmpArr = [token, timestamp, nonce].sort();
    const tmpStr = tmpArr.join('');
    const shasum = crypto.createHash('sha1');
    shasum.update(tmpStr);
    const hashCode = shasum.digest('hex');
    
    return hashCode === signature;
  }
};

/**
 * 数据脱敏工具
 */
const mask = {
  /**
   * 手机号脱敏
   */
  phone(phone) {
    if (!phone || phone.length < 7) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },
  
  /**
   * 邮箱脱敏
   */
  email(email) {
    if (!email || !email.includes('@')) return email;
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : username;
    return `${maskedUsername}@${domain}`;
  },
  
  /**
   * 身份证脱敏
   */
  idCard(idCard) {
    if (!idCard || idCard.length < 8) return idCard;
    return idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2');
  },
  
  /**
   * 银行卡脱敏
   */
  bankCard(cardNumber) {
    if (!cardNumber || cardNumber.length < 8) return cardNumber;
    return cardNumber.replace(/(\d{4})\d+(\d{4})/, '$1****$2');
  },
  
  /**
   * 姓名脱敏
   */
  name(name) {
    if (!name || name.length < 2) return name;
    return name.charAt(0) + '*'.repeat(name.length - 1);
  }
};

module.exports = {
  password,
  token,
  encryption,
  hash,
  random,
  wechat,
  mask
};