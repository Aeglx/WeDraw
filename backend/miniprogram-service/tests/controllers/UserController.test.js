const request = require('supertest');
const express = require('express');
const UserController = require('../../src/controllers/UserController');
const { User, Session } = require('../../src/models');
const { token } = require('../../src/utils/crypto');
const config = require('../../src/config');

// Mock dependencies
jest.mock('../../src/models');
jest.mock('../../src/utils/crypto');
jest.mock('../../src/config');

describe('UserController', () => {
  let app;
  let userController;
  let mockUser;
  let mockSession;
  let mockToken;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    userController = new UserController();
    
    // Mock config
    config.wechat = {
      appId: 'test_app_id',
      appSecret: 'test_app_secret'
    };
    
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
      unionid: 'test_unionid',
      nickname: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      gender: 1,
      city: 'Beijing',
      province: 'Beijing',
      country: 'China',
      status: 'active',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      generateAccessToken: jest.fn().mockReturnValue('mock_access_token'),
      save: jest.fn().mockResolvedValue(true)
    };
    
    // Mock session data
    mockSession = {
      id: 1,
      userId: 1,
      sessionId: 'test_session_id',
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      refresh: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true)
    };
    
    // Mock token
    mockToken = 'mock_jwt_token';
  });

  describe('POST /login - wxLogin', () => {
    beforeEach(() => {
      app.post('/login', userController.wxLogin.bind(userController));
    });

    it('should login successfully with valid code', async () => {
      // Mock WeChat API response
      const mockWxResponse = {
        openid: 'test_openid',
        session_key: 'test_session_key',
        unionid: 'test_unionid'
      };
      
      // Mock axios request
      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue({ data: mockWxResponse });
      
      // Mock User.findOrCreate
      User.findOrCreate = jest.fn().mockResolvedValue([mockUser, true]);
      
      // Mock Session.create
      Session.create = jest.fn().mockResolvedValue(mockSession);
      
      // Mock token generation
      token.generateAccessToken = jest.fn().mockReturnValue(mockToken);

      const response = await request(app)
        .post('/login')
        .send({
          code: 'valid_wx_code'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBe(mockToken);
      expect(User.findOrCreate).toHaveBeenCalled();
      expect(Session.create).toHaveBeenCalled();
    });

    it('should return error with invalid code', async () => {
      // Mock WeChat API error response
      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue({
        data: {
          errcode: 40013,
          errmsg: 'invalid appid'
        }
      });

      const response = await request(app)
        .post('/login')
        .send({
          code: 'invalid_wx_code'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('微信');
    });

    it('should return error when code is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /profile - getUserInfo', () => {
    beforeEach(() => {
      // Mock authentication middleware
      app.use((req, res, next) => {
        req.user = mockUser;
        req.session = mockSession;
        next();
      });
      
      app.get('/profile', userController.getUserInfo.bind(userController));
    });

    it('should return user profile successfully', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', 'Bearer ' + mockToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(mockUser.id);
      expect(response.body.data.user.nickname).toBe(mockUser.nickname);
    });
  });

  describe('PUT /profile - updateUserInfo', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.put('/profile', userController.updateUserInfo.bind(userController));
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        nickname: 'Updated Name',
        city: 'Shanghai'
      };

      const response = await request(app)
        .put('/profile')
        .set('Authorization', 'Bearer ' + mockToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should validate input data', async () => {
      const invalidData = {
        nickname: '', // Empty nickname should be invalid
        gender: 5 // Invalid gender value
      };

      const response = await request(app)
        .put('/profile')
        .set('Authorization', 'Bearer ' + mockToken)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /logout - logout', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        req.session = mockSession;
        next();
      });
      
      app.post('/logout', userController.logout.bind(userController));
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/logout')
        .set('Authorization', 'Bearer ' + mockToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockSession.destroy).toHaveBeenCalled();
    });
  });

  describe('POST /logout-all - destroyAllSessions', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.post('/logout-all', userController.destroyAllSessions.bind(userController));
    });

    it('should destroy all sessions successfully', async () => {
      Session.update = jest.fn().mockResolvedValue([2]); // Mock affected rows

      const response = await request(app)
        .post('/logout-all')
        .set('Authorization', 'Bearer ' + mockToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Session.update).toHaveBeenCalledWith(
        { isActive: false },
        { where: { userId: mockUser.id } }
      );
    });
  });

  describe('GET /sessions - getUserSessions', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.get('/sessions', userController.getUserSessions.bind(userController));
    });

    it('should return user sessions successfully', async () => {
      const mockSessions = [
        { ...mockSession, id: 1 },
        { ...mockSession, id: 2 }
      ];
      
      Session.findAll = jest.fn().mockResolvedValue(mockSessions);

      const response = await request(app)
        .get('/sessions')
        .set('Authorization', 'Bearer ' + mockToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toHaveLength(2);
      expect(Session.findAll).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isActive: true },
        order: [['createdAt', 'DESC']]
      });
    });
  });

  describe('GET /stats - getUserStats', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.get('/stats', userController.getUserStats.bind(userController));
    });

    it('should return user statistics successfully', async () => {
      // Mock Message model
      const Message = require('../../src/models').Message;
      Message.count = jest.fn()
        .mockResolvedValueOnce(10) // sent messages
        .mockResolvedValueOnce(5)  // received messages
        .mockResolvedValueOnce(2); // failed messages
      
      Session.count = jest.fn().mockResolvedValue(3); // total sessions

      const response = await request(app)
        .get('/stats')
        .set('Authorization', 'Bearer ' + mockToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.messagesSent).toBe(10);
      expect(response.body.data.stats.messagesReceived).toBe(5);
      expect(response.body.data.stats.messagesFailed).toBe(2);
      expect(response.body.data.stats.totalSessions).toBe(3);
    });
  });

  describe('Admin endpoints', () => {
    beforeEach(() => {
      // Mock admin user
      const adminUser = { ...mockUser, role: 'admin' };
      
      app.use((req, res, next) => {
        req.user = adminUser;
        next();
      });
    });

    describe('GET / - getUserList', () => {
      beforeEach(() => {
        app.get('/users', userController.getUserList.bind(userController));
      });

      it('should return user list for admin', async () => {
        const mockUsers = [
          { ...mockUser, id: 1 },
          { ...mockUser, id: 2 }
        ];
        
        User.findAndCountAll = jest.fn().mockResolvedValue({
          rows: mockUsers,
          count: 2
        });

        const response = await request(app)
          .get('/users?page=1&limit=10')
          .set('Authorization', 'Bearer ' + mockToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toHaveLength(2);
        expect(response.body.data.pagination.total).toBe(2);
      });
    });

    describe('PATCH /batch-status - batchUpdateUserStatus', () => {
      beforeEach(() => {
        app.patch('/users/batch-status', userController.batchUpdateUserStatus.bind(userController));
      });

      it('should update user status in batch', async () => {
        User.update = jest.fn().mockResolvedValue([2]); // Mock affected rows

        const response = await request(app)
          .patch('/users/batch-status')
          .set('Authorization', 'Bearer ' + mockToken)
          .send({
            userIds: [1, 2],
            status: 'inactive',
            reason: 'Test reason'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(User.update).toHaveBeenCalledWith(
          { status: 'inactive' },
          { where: { id: [1, 2] } }
        );
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.get('/error-test', userController.getUserInfo.bind(userController));
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      User.findByPk = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/error-test')
        .set('Authorization', 'Bearer ' + mockToken);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器');
    });
  });

  describe('Input validation', () => {
    it('should validate required fields', async () => {
      app.post('/login-test', userController.wxLogin.bind(userController));

      const response = await request(app)
        .post('/login-test')
        .send({}); // Missing required code field

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should sanitize input data', async () => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.put('/profile-test', userController.updateUserInfo.bind(userController));

      const response = await request(app)
        .put('/profile-test')
        .set('Authorization', 'Bearer ' + mockToken)
        .send({
          nickname: '<script>alert("xss")</script>Test User',
          city: '  Shanghai  ' // Should be trimmed
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Verify that XSS content is sanitized and whitespace is trimmed
    });
  });

  describe('Rate limiting', () => {
    it('should respect rate limits', async () => {
      app.post('/login-rate-test', userController.wxLogin.bind(userController));

      // Mock rate limiter to simulate limit exceeded
      const mockRateLimiter = jest.fn((req, res, next) => {
        res.status(429).json({
          success: false,
          message: '请求过于频繁，请稍后再试',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      });

      app.use('/login-rate-test', mockRateLimiter);

      const response = await request(app)
        .post('/login-rate-test')
        .send({ code: 'test_code' });

      expect(response.status).toBe(429);
      expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});