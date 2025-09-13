const express = require('express');
const { body, query, param } = require('express-validator');
const multer = require('multer');
const wechatController = require('../controllers/wechatController');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = express.Router();

// 配置文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif'],
      voice: ['audio/amr', 'audio/mp3'],
      video: ['video/mp4'],
      thumb: ['image/jpeg', 'image/png'],
    };
    
    const type = req.body.type;
    if (type && allowedTypes[type] && allowedTypes[type].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

// XML解析中间件
const xmlParser = (req, res, next) => {
  if (req.method === 'POST' && req.get('Content-Type')?.includes('text/xml')) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.body = data;
      next();
    });
  } else {
    next();
  }
};

/**
 * @swagger
 * /api/wechat:
 *   get:
 *     summary: 微信服务器验证
 *     tags: [WeChat]
 *     parameters:
 *       - in: query
 *         name: signature
 *         required: true
 *         schema:
 *           type: string
 *         description: 微信加密签名
 *       - in: query
 *         name: timestamp
 *         required: true
 *         schema:
 *           type: string
 *         description: 时间戳
 *       - in: query
 *         name: nonce
 *         required: true
 *         schema:
 *           type: string
 *         description: 随机数
 *       - in: query
 *         name: echostr
 *         required: true
 *         schema:
 *           type: string
 *         description: 随机字符串
 *     responses:
 *       200:
 *         description: 验证成功，返回echostr
 *       403:
 *         description: 验证失败
 */
router.get('/', [
  query('signature').isString().notEmpty(),
  query('timestamp').isString().notEmpty(),
  query('nonce').isString().notEmpty(),
  query('echostr').isString().notEmpty(),
  validateRequest,
], wechatController.verify);

/**
 * @swagger
 * /api/wechat:
 *   post:
 *     summary: 处理微信消息推送
 *     tags: [WeChat]
 *     parameters:
 *       - in: query
 *         name: signature
 *         required: true
 *         schema:
 *           type: string
 *         description: 微信加密签名
 *       - in: query
 *         name: timestamp
 *         required: true
 *         schema:
 *           type: string
 *         description: 时间戳
 *       - in: query
 *         name: nonce
 *         required: true
 *         schema:
 *           type: string
 *         description: 随机数
 *     requestBody:
 *       required: true
 *       content:
 *         text/xml:
 *           schema:
 *             type: string
 *             description: 微信推送的XML消息
 *     responses:
 *       200:
 *         description: 处理成功
 */
router.post('/', [
  query('signature').isString().notEmpty(),
  query('timestamp').isString().notEmpty(),
  query('nonce').isString().notEmpty(),
  validateRequest,
  xmlParser,
], wechatController.handleMessage);

/**
 * @swagger
 * /api/wechat/user/{openid}:
 *   get:
 *     summary: 获取微信用户信息
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: openid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户openid
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *       404:
 *         description: 用户不存在
 */
router.get('/user/:openid', [
  authenticate,
  param('openid').isString().notEmpty(),
  validateRequest,
], wechatController.getUserInfo);

/**
 * @swagger
 * /api/wechat/users:
 *   get:
 *     summary: 获取微信用户列表
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: next_openid
 *         schema:
 *           type: string
 *         description: 拉取列表的第一个用户的OPENID，不填默认从头开始拉取
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 */
router.get('/users', [
  authenticate,
  query('next_openid').optional().isString(),
  validateRequest,
], wechatController.getUserList);

/**
 * @swagger
 * /api/wechat/menu:
 *   post:
 *     summary: 创建自定义菜单
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - button
 *             properties:
 *               button:
 *                 type: array
 *                 description: 菜单按钮数组
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [click, view, scancode_push, scancode_waitmsg, pic_sysphoto, pic_photo_or_album, pic_weixin, location_select]
 *                     name:
 *                       type: string
 *                       description: 菜单标题
 *                     key:
 *                       type: string
 *                       description: 菜单KEY值（click类型必须）
 *                     url:
 *                       type: string
 *                       description: 网页链接（view类型必须）
 *                     sub_button:
 *                       type: array
 *                       description: 二级菜单数组
 *     responses:
 *       200:
 *         description: 菜单创建成功
 */
router.post('/menu', [
  authenticate,
  rateLimiter('menu', 10, 60), // 每分钟最多10次
  body('button').isArray().notEmpty(),
  validateRequest,
], wechatController.createMenu);

/**
 * @swagger
 * /api/wechat/menu:
 *   get:
 *     summary: 获取自定义菜单
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取菜单
 */
router.get('/menu', [
  authenticate,
], wechatController.getMenu);

/**
 * @swagger
 * /api/wechat/menu:
 *   delete:
 *     summary: 删除自定义菜单
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 菜单删除成功
 */
router.delete('/menu', [
  authenticate,
  rateLimiter('menu', 5, 60), // 每分钟最多5次
], wechatController.deleteMenu);

/**
 * @swagger
 * /api/wechat/tags:
 *   post:
 *     summary: 创建标签
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 标签名称
 *     responses:
 *       200:
 *         description: 标签创建成功
 */
router.post('/tags', [
  authenticate,
  rateLimiter('tag', 20, 60), // 每分钟最多20次
  body('name').isString().isLength({ min: 1, max: 30 }),
  validateRequest,
], wechatController.createTag);

/**
 * @swagger
 * /api/wechat/tags:
 *   get:
 *     summary: 获取标签列表
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取标签列表
 */
router.get('/tags', [
  authenticate,
], wechatController.getTags);

/**
 * @swagger
 * /api/wechat/tags/{id}:
 *   put:
 *     summary: 更新标签
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 标签ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 标签名称
 *     responses:
 *       200:
 *         description: 标签更新成功
 */
router.put('/tags/:id', [
  authenticate,
  param('id').isInt().toInt(),
  body('name').isString().isLength({ min: 1, max: 30 }),
  validateRequest,
], wechatController.updateTag);

/**
 * @swagger
 * /api/wechat/tags/{id}:
 *   delete:
 *     summary: 删除标签
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 标签ID
 *     responses:
 *       200:
 *         description: 标签删除成功
 */
router.delete('/tags/:id', [
  authenticate,
  param('id').isInt().toInt(),
  validateRequest,
], wechatController.deleteTag);

/**
 * @swagger
 * /api/wechat/tags/batch-tagging:
 *   post:
 *     summary: 批量为用户打标签
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tag_id
 *               - openid_list
 *             properties:
 *               tag_id:
 *                 type: integer
 *                 description: 标签ID
 *               openid_list:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 用户openid列表
 *     responses:
 *       200:
 *         description: 批量打标签成功
 */
router.post('/tags/batch-tagging', [
  authenticate,
  rateLimiter('batch_tag', 10, 60), // 每分钟最多10次
  body('tag_id').isInt(),
  body('openid_list').isArray().isLength({ min: 1, max: 50 }),
  validateRequest,
], wechatController.batchTagging);

/**
 * @swagger
 * /api/wechat/tags/batch-untagging:
 *   post:
 *     summary: 批量为用户取消标签
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tag_id
 *               - openid_list
 *             properties:
 *               tag_id:
 *                 type: integer
 *                 description: 标签ID
 *               openid_list:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 用户openid列表
 *     responses:
 *       200:
 *         description: 批量取消标签成功
 */
router.post('/tags/batch-untagging', [
  authenticate,
  rateLimiter('batch_tag', 10, 60), // 每分钟最多10次
  body('tag_id').isInt(),
  body('openid_list').isArray().isLength({ min: 1, max: 50 }),
  validateRequest,
], wechatController.batchUntagging);

/**
 * @swagger
 * /api/wechat/user/{openid}/tags:
 *   get:
 *     summary: 获取用户标签
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: openid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户openid
 *     responses:
 *       200:
 *         description: 成功获取用户标签
 */
router.get('/user/:openid/tags', [
  authenticate,
  param('openid').isString().notEmpty(),
  validateRequest,
], wechatController.getUserTags);

/**
 * @swagger
 * /api/wechat/media/upload:
 *   post:
 *     summary: 上传多媒体文件
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - media
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [image, voice, video, thumb]
 *                 description: 媒体文件类型
 *               media:
 *                 type: string
 *                 format: binary
 *                 description: 要上传的文件
 *     responses:
 *       200:
 *         description: 文件上传成功
 */
router.post('/media/upload', [
  authenticate,
  rateLimiter('upload', 20, 60), // 每分钟最多20次
  upload.single('media'),
  body('type').isIn(['image', 'voice', 'video', 'thumb']),
  validateRequest,
], wechatController.uploadMedia);

/**
 * @swagger
 * /api/wechat/qrcode:
 *   post:
 *     summary: 生成带参数的二维码
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scene_id
 *             properties:
 *               scene_id:
 *                 type: integer
 *                 description: 场景值ID
 *               is_temporary:
 *                 type: boolean
 *                 default: true
 *                 description: 是否为临时二维码
 *               expire_seconds:
 *                 type: integer
 *                 default: 604800
 *                 description: 过期时间（秒）
 *     responses:
 *       200:
 *         description: 二维码生成成功
 */
router.post('/qrcode', [
  authenticate,
  rateLimiter('qrcode', 30, 60), // 每分钟最多30次
  body('scene_id').isInt(),
  body('is_temporary').optional().isBoolean(),
  body('expire_seconds').optional().isInt({ min: 30, max: 2592000 }),
  validateRequest,
], wechatController.createQRCode);

/**
 * @swagger
 * /api/wechat/callback-ip:
 *   get:
 *     summary: 获取微信服务器IP列表
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取IP列表
 */
router.get('/callback-ip', [
  authenticate,
], wechatController.getCallbackIP);

/**
 * @swagger
 * /api/wechat/access-token:
 *   get:
 *     summary: 获取访问令牌（仅开发环境）
 *     tags: [WeChat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取访问令牌
 *       403:
 *         description: 仅开发环境可用
 */
router.get('/access-token', [
  authenticate,
], wechatController.getAccessToken);

/**
 * @swagger
 * /api/wechat/health:
 *   get:
 *     summary: 微信服务健康检查
 *     tags: [WeChat]
 *     responses:
 *       200:
 *         description: 服务正常
 *       500:
 *         description: 服务异常
 */
router.get('/health', wechatController.healthCheck);

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超出限制',
      });
    }
  }
  
  if (error.message === '不支持的文件类型') {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  
  logger.error('WeChat route error:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
  });
});

module.exports = router;