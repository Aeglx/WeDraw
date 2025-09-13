const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin, optionalAuth, requireActiveUser, requireRole } = require('../../src/middleware/auth');
const { User, Session } = require('../../src/models');
const config = require('../../src/config');

// Mock dependencies
jest.mock('../../src/models');
jest.mock('../../src/config');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let app;
  let mockUser;
  let mockSession;
  let validToken;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock config
    config.jwt = {
      secret: 'test_secret',
      expiresIn: '1h'
    };
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock user data
    mockUser = {
      id: 1,
      openid: 'test_openid',
      nickname: 'Test User',
      status: 'active',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Mock session data
    mockSession = {
      id: 1,
      userId: 1,
      sessionId: 'test_session_id',
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Mock valid token
    validToken = 'valid.jwt.token';
  });

  describe('authenticateToken middleware', () => {
    beforeEach(() => {
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({
          success: true,
          user: req.user,
          session: req.session
        });
      });
    });

    it('should authenticate valid token successfully', async () => {
      // Mock JWT verification
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      // Mock User.findByPk
      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      
      // Mock Session.findOne
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe(1);
      expect(jwt.verify).toHaveBeenCalledWith(validToken, config.jwt.secret);
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(Session.findOne).toHaveBeenCalledWith({
        where: {
          sessionId: 'test_session_id',
          isActive: true
        }
      });
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('访问令牌缺失');
    });

    it('should reject request with invalid token format', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('访问令牌格式错误');
    });

    it('should reject request with expired token', async () => {
      // Mock JWT verification to throw expired error
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('访问令牌已过期');
    });

    it('should reject request with invalid token', async () => {
      // Mock JWT verification to throw invalid token error
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('访问令牌无效');
    });

    it('should reject request when user not found', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 999,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户不存在');
    });

    it('should reject request when session not found', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'invalid_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      Session.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('会话无效');
    });

    it('should reject request when session is expired', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      Session.findOne = jest.fn().mockResolvedValue({
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('会话已过期');
    });

    it('should handle database errors gracefully', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器内部错误');
    });
  });

  describe('requireAdmin middleware', () => {
    beforeEach(() => {
      app.get('/admin-only', authenticateToken, requireAdmin, (req, res) => {
        res.json({ success: true, message: 'Admin access granted' });
      });
    });

    it('should allow access for admin users', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: 'admin'
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny access for non-admin users', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: 'user'
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('管理员权限');
    });

    it('should deny access when user role is undefined', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: undefined
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('optionalAuth middleware', () => {
    beforeEach(() => {
      app.get('/optional-auth', optionalAuth, (req, res) => {
        res.json({
          success: true,
          authenticated: !!req.user,
          user: req.user
        });
      });
    });

    it('should authenticate when valid token is provided', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/optional-auth')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.authenticated).toBe(true);
      expect(response.body.user.id).toBe(1);
    });

    it('should continue without authentication when no token is provided', async () => {
      const response = await request(app)
        .get('/optional-auth');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.authenticated).toBe(false);
      expect(response.body.user).toBeUndefined();
    });

    it('should continue without authentication when invalid token is provided', async () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('invalid token');
      });

      const response = await request(app)
        .get('/optional-auth')
        .set('Authorization', `Bearer invalid_token`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.authenticated).toBe(false);
    });
  });

  describe('requireActiveUser middleware', () => {
    beforeEach(() => {
      app.get('/active-only', authenticateToken, requireActiveUser, (req, res) => {
        res.json({ success: true, message: 'Active user access granted' });
      });
    });

    it('should allow access for active users', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        status: 'active'
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/active-only')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny access for inactive users', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        status: 'inactive'
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/active-only')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('账户已被禁用');
    });

    it('should deny access for suspended users', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        status: 'suspended'
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/active-only')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('账户已被暂停');
    });
  });

  describe('requireRole middleware', () => {
    beforeEach(() => {
      app.get('/moderator-only', authenticateToken, requireRole('moderator'), (req, res) => {
        res.json({ success: true, message: 'Moderator access granted' });
      });
      
      app.get('/multi-role', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
        res.json({ success: true, message: 'Multi-role access granted' });
      });
    });

    it('should allow access for users with required role', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: 'moderator'
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/moderator-only')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny access for users without required role', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: 'user'
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/moderator-only')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });

    it('should allow access for users with any of the required roles', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: 'admin'
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/multi-role')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny access when user has none of the required roles', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: 'user'
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/multi-role')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });
  });

  describe('Middleware chaining', () => {
    beforeEach(() => {
      app.get('/admin-active', authenticateToken, requireActiveUser, requireAdmin, (req, res) => {
        res.json({ success: true, message: 'Admin and active user access granted' });
      });
    });

    it('should pass through multiple middleware successfully', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: 'admin',
        status: 'active'
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/admin-active')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail at first middleware that rejects', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: 'admin',
        status: 'inactive' // This should fail at requireActiveUser
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/admin-active')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('账户已被禁用');
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed JWT payload', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        // Missing required fields
        someOtherField: 'value'
      });

      app.get('/edge-case', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/edge-case')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle null user role gracefully', async () => {
      jwt.verify = jest.fn().mockReturnValue({
        userId: 1,
        sessionId: 'test_session_id'
      });
      
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: null
      });
      
      Session.findOne = jest.fn().mockResolvedValue(mockSession);

      app.get('/null-role', authenticateToken, requireAdmin, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/null-role')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});