/**
 * 用户控制器
 */

const BaseController = require('./BaseController');
const { User, Session } = require('../models');
const { WeChatUtils, CacheUtils, ValidationUtils } = require('../utils');
const config = require('../config');

class UserController extends BaseController {
  constructor() {
    super();
    this.wechatUtils = new WeChatUtils();
    this.cacheUtils = new CacheUtils();
  }

  /**
   * 微信登录
   */
  login = this.asyncHandler(async (req, res) => {
    const { code, userInfo = {}, deviceInfo = {} } = req.body;
    
    if (!code) {
      return this.error(res, '登录凭证不能为空', 400);
    }

    try {
      // 通过code获取session_key和openid
      const wxResult = await this.wechatUtils.code2Session(code);
      
      if (wxResult.errcode) {
        return this.error(res, `微信登录失败: ${wxResult.errmsg}`, 400);
      }

      const { openid, session_key, unionid } = wxResult;

      // 创建或更新用户
      const user = await User.createOrUpdate({
        openid,
        unionid,
        session_key,
        ...userInfo
      });

      // 创建或更新会话
      const session = await Session.createOrUpdate({
        user_id: user.id,
        openid,
        session_key,
        unionid,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        device_info: deviceInfo,
        expires_in: config.jwt.expiresIn
      });

      // 更新最后登录时间
      await user.updateLastLogin();

      // 缓存用户信息
      await this.cacheUtils.setUserInfo(user.id, user.getBasicInfo());

      this.success(res, {
        user: user.getBasicInfo(),
        session: session.getInfo(),
        token: session.session_key
      }, '登录成功');

    } catch (error) {
      console.error('用户登录失败:', error);
      this.error(res, '登录失败，请重试', 500);
    }
  });

  /**
   * 获取用户信息
   */
  getUserInfo = this.asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      // 先从缓存获取
      let userInfo = await this.cacheUtils.getUserInfo(userId);
      
      if (!userInfo) {
        // 缓存未命中，从数据库获取
        const user = await User.findByPk(userId);
        if (!user) {
          return this.error(res, '用户不存在', 404);
        }
        
        userInfo = user.getFullInfo();
        // 更新缓存
        await this.cacheUtils.setUserInfo(userId, userInfo);
      }

      this.success(res, userInfo);

    } catch (error) {
      console.error('获取用户信息失败:', error);
      this.error(res, '获取用户信息失败', 500);
    }
  });

  /**
   * 更新用户信息
   */
  updateUserInfo = this.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const updateData = req.body;

    try {
      // 验证更新数据
      const validation = ValidationUtils.validateUserUpdate(updateData);
      if (!validation.isValid) {
        return this.error(res, validation.errors.join(', '), 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return this.error(res, '用户不存在', 404);
      }

      // 更新用户信息
      await user.updateUserInfo(updateData);

      // 清除缓存
      await this.cacheUtils.deleteUserInfo(userId);

      this.success(res, user.getBasicInfo(), '用户信息更新成功');

    } catch (error) {
      console.error('更新用户信息失败:', error);
      this.error(res, '更新用户信息失败', 500);
    }
  });

  /**
   * 获取用户列表（管理员）
   */
  getUserList = this.asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = null,
      gender = null,
      city = null,
      province = null,
      startDate = null,
      endDate = null
    } = req.query;

    try {
      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        search,
        gender: gender ? parseInt(gender) : null,
        city,
        province
      };

      // 添加日期过滤
      if (startDate || endDate) {
        options.dateRange = { startDate, endDate };
      }

      const result = await User.getActiveUsers(options);

      this.paginate(res, result.users, result.pagination);

    } catch (error) {
      console.error('获取用户列表失败:', error);
      this.error(res, '获取用户列表失败', 500);
    }
  });

  /**
   * 获取用户详情（管理员）
   */
  getUserDetail = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const user = await User.findByPk(id, {
        include: [
          {
            model: Session,
            as: 'sessions',
            where: { status: 'active' },
            required: false,
            limit: 5,
            order: [['created_at', 'DESC']]
          }
        ]
      });

      if (!user) {
        return this.error(res, '用户不存在', 404);
      }

      this.success(res, {
        ...user.getFullInfo(),
        sessions: user.sessions?.map(session => session.getInfo()) || []
      });

    } catch (error) {
      console.error('获取用户详情失败:', error);
      this.error(res, '获取用户详情失败', 500);
    }
  });

  /**
   * 批量更新用户状态（管理员）
   */
  batchUpdateStatus = this.asyncHandler(async (req, res) => {
    const { userIds, status } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return this.error(res, '用户ID列表不能为空', 400);
    }

    if (!['active', 'inactive', 'banned'].includes(status)) {
      return this.error(res, '无效的用户状态', 400);
    }

    try {
      const affectedCount = await User.batchUpdateStatus(userIds, status);

      // 清除相关用户的缓存
      for (const userId of userIds) {
        await this.cacheUtils.deleteUserInfo(userId);
      }

      this.success(res, {
        affected_count: affectedCount,
        user_ids: userIds,
        new_status: status
      }, `成功更新 ${affectedCount} 个用户状态`);

    } catch (error) {
      console.error('批量更新用户状态失败:', error);
      this.error(res, '批量更新用户状态失败', 500);
    }
  });

  /**
   * 获取用户统计信息
   */
  getUserStats = this.asyncHandler(async (req, res) => {
    try {
      const stats = await User.getStats();
      const sessionStats = await Session.getActiveStats();

      this.success(res, {
        ...stats,
        ...sessionStats
      });

    } catch (error) {
      console.error('获取用户统计失败:', error);
      this.error(res, '获取用户统计失败', 500);
    }
  });

  /**
   * 用户注销
   */
  logout = this.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const sessionKey = req.session?.session_key;

    try {
      if (sessionKey) {
        // 销毁当前会话
        const session = await Session.findBySessionKey(sessionKey);
        if (session) {
          await session.destroy();
        }
      }

      // 清除用户缓存
      await this.cacheUtils.deleteUserInfo(userId);

      this.success(res, null, '注销成功');

    } catch (error) {
      console.error('用户注销失败:', error);
      this.error(res, '注销失败', 500);
    }
  });

  /**
   * 销毁所有会话
   */
  logoutAll = this.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const currentSessionKey = req.session?.session_key;

    try {
      // 获取当前会话ID（如果存在）
      let excludeSessionIds = [];
      if (currentSessionKey) {
        const currentSession = await Session.findBySessionKey(currentSessionKey);
        if (currentSession) {
          excludeSessionIds = [currentSession.id];
        }
      }

      // 销毁除当前会话外的所有会话
      const affectedCount = await Session.destroyUserSessions(userId, excludeSessionIds);

      // 清除用户缓存
      await this.cacheUtils.deleteUserInfo(userId);

      this.success(res, {
        destroyed_sessions: affectedCount
      }, '已销毁所有其他会话');

    } catch (error) {
      console.error('销毁所有会话失败:', error);
      this.error(res, '销毁会话失败', 500);
    }
  });

  /**
   * 获取用户会话列表
   */
  getUserSessions = this.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, includeExpired = false } = req.query;

    try {
      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        includeExpired: includeExpired === 'true'
      };

      const result = await Session.getUserSessions(userId, options);

      this.paginate(res, result.sessions, result.pagination);

    } catch (error) {
      console.error('获取用户会话列表失败:', error);
      this.error(res, '获取会话列表失败', 500);
    }
  });

  /**
   * 刷新会话
   */
  refreshSession = this.asyncHandler(async (req, res) => {
    const sessionKey = req.session?.session_key;

    if (!sessionKey) {
      return this.error(res, '会话不存在', 401);
    }

    try {
      const session = await Session.findBySessionKey(sessionKey);
      if (!session || !session.isValid()) {
        return this.error(res, '会话无效或已过期', 401);
      }

      // 刷新会话
      await session.refresh();

      this.success(res, session.getInfo(), '会话刷新成功');

    } catch (error) {
      console.error('刷新会话失败:', error);
      this.error(res, '刷新会话失败', 500);
    }
  });

  /**
   * 解密微信数据
   */
  decryptData = this.asyncHandler(async (req, res) => {
    const { encryptedData, iv } = req.body;
    const sessionKey = req.session?.session_key;

    if (!encryptedData || !iv) {
      return this.error(res, '加密数据和初始向量不能为空', 400);
    }

    if (!sessionKey) {
      return this.error(res, '会话密钥不存在', 401);
    }

    try {
      const decryptedData = this.wechatUtils.decryptData(
        sessionKey,
        encryptedData,
        iv
      );

      this.success(res, decryptedData);

    } catch (error) {
      console.error('解密微信数据失败:', error);
      this.error(res, '数据解密失败', 400);
    }
  });
}

module.exports = UserController;