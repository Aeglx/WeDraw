const request = require('supertest');
const express = require('express');
const MessageController = require('../../src/controllers/MessageController');
const { Message, User, MessageTemplate } = require('../../src/models');
const config = require('../../src/config');

// Mock dependencies
jest.mock('../../src/models');
jest.mock('../../src/config');
jest.mock('axios');

describe('MessageController', () => {
  let app;
  let messageController;
  let mockUser;
  let mockMessage;
  let mockTemplate;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    messageController = new MessageController();
    
    // Mock config
    config.wechat = {
      appId: 'test_app_id',
      appSecret: 'test_app_secret'
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
      role: 'user'
    };
    
    // Mock message data
    mockMessage = {
      id: 1,
      fromUserId: 1,
      toUserId: 2,
      type: 'text',
      content: 'Test message',
      status: 'sent',
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };
    
    // Mock template data
    mockTemplate = {
      id: 1,
      name: 'welcome',
      title: '欢迎消息',
      content: '欢迎使用我们的服务！',
      type: 'system',
      status: 'active'
    };
  });

  describe('POST /send - sendTextMessage', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.post('/send', messageController.sendTextMessage.bind(messageController));
    });

    it('should send text message successfully', async () => {
      // Mock User.findByPk
      User.findByPk = jest.fn().mockResolvedValue({
        id: 2,
        openid: 'target_openid',
        status: 'active'
      });
      
      // Mock Message.create
      Message.create = jest.fn().mockResolvedValue(mockMessage);
      
      // Mock WeChat API
      const axios = require('axios');
      axios.post = jest.fn().mockResolvedValue({
        data: { errcode: 0, errmsg: 'ok' }
      });

      const response = await request(app)
        .post('/send')
        .send({
          toUserId: 2,
          content: 'Hello, this is a test message'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBeDefined();
      expect(Message.create).toHaveBeenCalled();
    });

    it('should return error when target user not found', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/send')
        .send({
          toUserId: 999,
          content: 'Hello'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户不存在');
    });

    it('should return error when target user is inactive', async () => {
      User.findByPk = jest.fn().mockResolvedValue({
        id: 2,
        status: 'inactive'
      });

      const response = await request(app)
        .post('/send')
        .send({
          toUserId: 2,
          content: 'Hello'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户状态异常');
    });

    it('should validate message content', async () => {
      const response = await request(app)
        .post('/send')
        .send({
          toUserId: 2,
          content: '' // Empty content
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle WeChat API errors', async () => {
      User.findByPk = jest.fn().mockResolvedValue({
        id: 2,
        openid: 'target_openid',
        status: 'active'
      });
      
      Message.create = jest.fn().mockResolvedValue(mockMessage);
      
      // Mock WeChat API error
      const axios = require('axios');
      axios.post = jest.fn().mockResolvedValue({
        data: { errcode: 40001, errmsg: 'invalid credential' }
      });

      const response = await request(app)
        .post('/send')
        .send({
          toUserId: 2,
          content: 'Hello'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('发送失败');
    });
  });

  describe('POST /send-template - sendTemplateMessage', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.post('/send-template', messageController.sendTemplateMessage.bind(messageController));
    });

    it('should send template message successfully', async () => {
      // Mock MessageTemplate.findByPk
      MessageTemplate.findByPk = jest.fn().mockResolvedValue(mockTemplate);
      
      // Mock User.findByPk
      User.findByPk = jest.fn().mockResolvedValue({
        id: 2,
        openid: 'target_openid',
        status: 'active'
      });
      
      // Mock Message.create
      Message.create = jest.fn().mockResolvedValue({
        ...mockMessage,
        type: 'template',
        templateId: 1
      });
      
      // Mock WeChat API
      const axios = require('axios');
      axios.post = jest.fn().mockResolvedValue({
        data: { errcode: 0, errmsg: 'ok', msgid: 'wx_msg_id' }
      });

      const response = await request(app)
        .post('/send-template')
        .send({
          toUserId: 2,
          templateId: 1,
          data: {
            username: 'Test User',
            action: '登录'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(MessageTemplate.findByPk).toHaveBeenCalledWith(1);
      expect(Message.create).toHaveBeenCalled();
    });

    it('should return error when template not found', async () => {
      MessageTemplate.findByPk = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/send-template')
        .send({
          toUserId: 2,
          templateId: 999,
          data: {}
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('模板不存在');
    });

    it('should return error when template is inactive', async () => {
      MessageTemplate.findByPk = jest.fn().mockResolvedValue({
        ...mockTemplate,
        status: 'inactive'
      });

      const response = await request(app)
        .post('/send-template')
        .send({
          toUserId: 2,
          templateId: 1,
          data: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('模板已禁用');
    });
  });

  describe('POST /send-batch - sendBatchMessage', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = { ...mockUser, role: 'admin' }; // Admin user for batch operations
        next();
      });
      
      app.post('/send-batch', messageController.sendBatchMessage.bind(messageController));
    });

    it('should send batch messages successfully', async () => {
      const targetUsers = [
        { id: 2, openid: 'openid_2', status: 'active' },
        { id: 3, openid: 'openid_3', status: 'active' }
      ];
      
      // Mock User.findAll
      User.findAll = jest.fn().mockResolvedValue(targetUsers);
      
      // Mock Message.bulkCreate
      Message.bulkCreate = jest.fn().mockResolvedValue([
        { ...mockMessage, id: 1, toUserId: 2 },
        { ...mockMessage, id: 2, toUserId: 3 }
      ]);
      
      // Mock WeChat API
      const axios = require('axios');
      axios.post = jest.fn().mockResolvedValue({
        data: { errcode: 0, errmsg: 'ok' }
      });

      const response = await request(app)
        .post('/send-batch')
        .send({
          userIds: [2, 3],
          content: 'Batch message content',
          type: 'text'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(2);
      expect(Message.bulkCreate).toHaveBeenCalled();
    });

    it('should handle partial failures in batch sending', async () => {
      const targetUsers = [
        { id: 2, openid: 'openid_2', status: 'active' },
        { id: 3, openid: 'openid_3', status: 'active' }
      ];
      
      User.findAll = jest.fn().mockResolvedValue(targetUsers);
      Message.bulkCreate = jest.fn().mockResolvedValue([
        { ...mockMessage, id: 1, toUserId: 2 },
        { ...mockMessage, id: 2, toUserId: 3 }
      ]);
      
      // Mock WeChat API with mixed results
      const axios = require('axios');
      axios.post = jest.fn()
        .mockResolvedValueOnce({ data: { errcode: 0, errmsg: 'ok' } }) // Success for first user
        .mockResolvedValueOnce({ data: { errcode: 40001, errmsg: 'invalid credential' } }); // Failure for second user

      const response = await request(app)
        .post('/send-batch')
        .send({
          userIds: [2, 3],
          content: 'Batch message content',
          type: 'text'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.successful).toBe(1);
      expect(response.body.data.summary.failed).toBe(1);
    });

    it('should require admin role for batch operations', async () => {
      // Override middleware to use regular user
      app.use('/send-batch-user', (req, res, next) => {
        req.user = { ...mockUser, role: 'user' };
        next();
      });
      
      app.post('/send-batch-user', messageController.sendBatchMessage.bind(messageController));

      const response = await request(app)
        .post('/send-batch-user')
        .send({
          userIds: [2, 3],
          content: 'Batch message content',
          type: 'text'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });
  });

  describe('GET / - getMessageList', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.get('/messages', messageController.getMessageList.bind(messageController));
    });

    it('should return message list successfully', async () => {
      const mockMessages = [
        { ...mockMessage, id: 1 },
        { ...mockMessage, id: 2 }
      ];
      
      Message.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockMessages,
        count: 2
      });

      const response = await request(app)
        .get('/messages?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter messages by type', async () => {
      Message.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [mockMessage],
        count: 1
      });

      const response = await request(app)
        .get('/messages?type=text&page=1&limit=10');

      expect(response.status).toBe(200);
      expect(Message.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'text'
          })
        })
      );
    });

    it('should filter messages by status', async () => {
      Message.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [mockMessage],
        count: 1
      });

      const response = await request(app)
        .get('/messages?status=sent&page=1&limit=10');

      expect(response.status).toBe(200);
      expect(Message.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'sent'
          })
        })
      );
    });
  });

  describe('GET /:id - getMessageDetail', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.get('/messages/:id', messageController.getMessageDetail.bind(messageController));
    });

    it('should return message detail successfully', async () => {
      Message.findByPk = jest.fn().mockResolvedValue(mockMessage);

      const response = await request(app)
        .get('/messages/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message.id).toBe(1);
    });

    it('should return error when message not found', async () => {
      Message.findByPk = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/messages/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('消息不存在');
    });

    it('should check message access permissions', async () => {
      const otherUserMessage = {
        ...mockMessage,
        fromUserId: 999,
        toUserId: 888
      };
      
      Message.findByPk = jest.fn().mockResolvedValue(otherUserMessage);

      const response = await request(app)
        .get('/messages/1');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权访问');
    });
  });

  describe('POST /:id/recall - recallMessage', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.post('/messages/:id/recall', messageController.recallMessage.bind(messageController));
    });

    it('should recall message successfully', async () => {
      const recentMessage = {
        ...mockMessage,
        fromUserId: 1,
        status: 'sent',
        sentAt: new Date(Date.now() - 60000) // 1 minute ago
      };
      
      Message.findByPk = jest.fn().mockResolvedValue(recentMessage);

      const response = await request(app)
        .post('/messages/1/recall')
        .send({ reason: 'Test recall' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(recentMessage.save).toHaveBeenCalled();
    });

    it('should not allow recalling old messages', async () => {
      const oldMessage = {
        ...mockMessage,
        fromUserId: 1,
        status: 'sent',
        sentAt: new Date(Date.now() - 10 * 60000) // 10 minutes ago
      };
      
      Message.findByPk = jest.fn().mockResolvedValue(oldMessage);

      const response = await request(app)
        .post('/messages/1/recall')
        .send({ reason: 'Test recall' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('超过撤回时限');
    });

    it('should not allow recalling messages from other users', async () => {
      const otherUserMessage = {
        ...mockMessage,
        fromUserId: 999,
        status: 'sent',
        sentAt: new Date(Date.now() - 60000)
      };
      
      Message.findByPk = jest.fn().mockResolvedValue(otherUserMessage);

      const response = await request(app)
        .post('/messages/1/recall')
        .send({ reason: 'Test recall' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权撤回');
    });
  });

  describe('POST /:id/retry - retryMessage', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.post('/messages/:id/retry', messageController.retryMessage.bind(messageController));
    });

    it('should retry failed message successfully', async () => {
      const failedMessage = {
        ...mockMessage,
        fromUserId: 1,
        status: 'failed',
        retryCount: 1
      };
      
      Message.findByPk = jest.fn().mockResolvedValue(failedMessage);
      
      // Mock WeChat API success
      const axios = require('axios');
      axios.post = jest.fn().mockResolvedValue({
        data: { errcode: 0, errmsg: 'ok' }
      });

      const response = await request(app)
        .post('/messages/1/retry');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(failedMessage.save).toHaveBeenCalled();
    });

    it('should not retry messages that are not failed', async () => {
      const sentMessage = {
        ...mockMessage,
        fromUserId: 1,
        status: 'sent'
      };
      
      Message.findByPk = jest.fn().mockResolvedValue(sentMessage);

      const response = await request(app)
        .post('/messages/1/retry');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('只能重试失败的消息');
    });

    it('should not retry messages that exceeded max retry count', async () => {
      const maxRetriedMessage = {
        ...mockMessage,
        fromUserId: 1,
        status: 'failed',
        retryCount: 3 // Assuming max retry is 3
      };
      
      Message.findByPk = jest.fn().mockResolvedValue(maxRetriedMessage);

      const response = await request(app)
        .post('/messages/1/retry');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('超过最大重试次数');
    });
  });

  describe('GET /stats - getMessageStats', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.get('/stats', messageController.getMessageStats.bind(messageController));
    });

    it('should return message statistics successfully', async () => {
      Message.count = jest.fn()
        .mockResolvedValueOnce(10) // total messages
        .mockResolvedValueOnce(8)  // sent messages
        .mockResolvedValueOnce(1)  // pending messages
        .mockResolvedValueOnce(1); // failed messages

      const response = await request(app)
        .get('/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.total).toBe(10);
      expect(response.body.data.stats.sent).toBe(8);
      expect(response.body.data.stats.pending).toBe(1);
      expect(response.body.data.stats.failed).toBe(1);
    });

    it('should filter stats by date range', async () => {
      Message.count = jest.fn().mockResolvedValue(5);

      const response = await request(app)
        .get('/stats?startDate=2024-01-01&endDate=2024-01-31');

      expect(response.status).toBe(200);
      expect(Message.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object)
          })
        })
      );
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.get('/error-test', messageController.getMessageList.bind(messageController));
    });

    it('should handle database errors gracefully', async () => {
      Message.findAndCountAll = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/error-test');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器');
    });
  });

  describe('Input validation', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      app.post('/validation-test', messageController.sendTextMessage.bind(messageController));
    });

    it('should validate message content length', async () => {
      const longContent = 'a'.repeat(2001); // Assuming max length is 2000

      const response = await request(app)
        .post('/validation-test')
        .send({
          toUserId: 2,
          content: longContent
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('内容长度');
    });

    it('should sanitize message content', async () => {
      User.findByPk = jest.fn().mockResolvedValue({
        id: 2,
        openid: 'target_openid',
        status: 'active'
      });
      
      Message.create = jest.fn().mockResolvedValue(mockMessage);
      
      const axios = require('axios');
      axios.post = jest.fn().mockResolvedValue({
        data: { errcode: 0, errmsg: 'ok' }
      });

      const response = await request(app)
        .post('/validation-test')
        .send({
          toUserId: 2,
          content: '<script>alert("xss")</script>Hello World'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Verify that XSS content is sanitized
    });
  });
});