/**
 * ContactController测试
 */

const { Contact, Department } = require('../../src/models');
const { CacheUtil } = require('../../src/utils');

describe('ContactController', () => {
  let authToken;
  let apiKey;
  let testDepartment;
  
  beforeEach(async () => {
    authToken = generateAuthToken();
    apiKey = generateApiKey();
    
    // 创建测试部门
    testDepartment = await Department.create(testUtils.createTestDepartment());
  });

  describe('GET /api/contacts', () => {
    beforeEach(async () => {
      // 创建测试联系人
      await Contact.bulkCreate([
        testUtils.createTestContact({ userId: 'user1', name: '张三' }),
        testUtils.createTestContact({ userId: 'user2', name: '李四' }),
        testUtils.createTestContact({ userId: 'user3', name: '王五', status: 0 })
      ]);
    });

    test('应该返回联系人列表', async () => {
      const response = await request
        .get('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data.contacts).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('应该支持分页查询', async () => {
      const response = await request
        .get('/api/contacts?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data.contacts).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    test('应该支持关键词搜索', async () => {
      const response = await request
        .get('/api/contacts?search=张三')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data.contacts).toHaveLength(1);
      expect(response.body.data.contacts[0].name).toBe('张三');
    });

    test('应该支持状态筛选', async () => {
      const response = await request
        .get('/api/contacts?status=1')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data.contacts).toHaveLength(2);
      response.body.data.contacts.forEach(contact => {
        expect(contact.status).toBe(1);
      });
    });

    test('应该支持部门筛选', async () => {
      const contact = await Contact.findOne();
      await contact.addDepartment(testDepartment);
      
      const response = await request
        .get(`/api/contacts?departmentId=${testDepartment.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data.contacts).toHaveLength(1);
    });

    test('未认证时应该返回401', async () => {
      const response = await request.get('/api/contacts');
      
      expect(response.status).toBe(401);
      expectError(response, 401, '访问令牌缺失');
    });

    test('应该使用缓存', async () => {
      // 第一次请求
      const response1 = await request
        .get('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response1.status).toBe(200);
      
      // 检查缓存是否存在
      const cacheKey = 'contacts:list:page:1:limit:20:search::status::departmentId:';
      const cached = await CacheUtil.get(cacheKey);
      expect(cached).toBeTruthy();
      
      // 第二次请求应该从缓存获取
      const response2 = await request
        .get('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response2.status).toBe(200);
      expect(response2.body).toEqual(response1.body);
    });
  });

  describe('GET /api/contacts/:id', () => {
    let contact;
    
    beforeEach(async () => {
      contact = await Contact.create(testUtils.createTestContact());
      await contact.addDepartment(testDepartment);
    });

    test('应该返回联系人详情', async () => {
      const response = await request
        .get(`/api/contacts/${contact.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data.id).toBe(contact.id);
      expect(response.body.data.name).toBe(contact.name);
      expect(response.body.data.departments).toHaveLength(1);
    });

    test('联系人不存在时应该返回404', async () => {
      const response = await request
        .get('/api/contacts/99999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
      expectError(response, 404, '联系人不存在');
    });

    test('无效ID格式应该返回400', async () => {
      const response = await request
        .get('/api/contacts/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
      expectError(response, 400);
    });
  });

  describe('POST /api/contacts', () => {
    test('应该成功创建联系人', async () => {
      const contactData = testUtils.createTestContact();
      
      const response = await request
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData);
      
      expect(response.status).toBe(201);
      expectSuccess(response);
      expect(response.body.data.userId).toBe(contactData.userId);
      expect(response.body.data.name).toBe(contactData.name);
      
      // 验证数据库中是否创建成功
      const created = await Contact.findOne({
        where: { userId: contactData.userId }
      });
      expect(created).toBeTruthy();
    });

    test('应该验证必填字段', async () => {
      const response = await request
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(response.status).toBe(400);
      expectError(response, 400, '请求参数验证失败');
    });

    test('应该验证手机号格式', async () => {
      const contactData = testUtils.createTestContact({
        mobile: '123456789'
      });
      
      const response = await request
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData);
      
      expect(response.status).toBe(400);
      expectError(response, 400);
    });

    test('应该验证邮箱格式', async () => {
      const contactData = testUtils.createTestContact({
        email: 'invalid-email'
      });
      
      const response = await request
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData);
      
      expect(response.status).toBe(400);
      expectError(response, 400);
    });

    test('userId重复时应该返回400', async () => {
      const contactData = testUtils.createTestContact();
      
      // 先创建一个联系人
      await Contact.create(contactData);
      
      // 再次创建相同userId的联系人
      const response = await request
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData);
      
      expect(response.status).toBe(400);
      expectError(response, 400, '数据重复');
    });

    test('应该清除相关缓存', async () => {
      // 先设置缓存
      await CacheUtil.set('contacts:list:page:1:limit:20:search::status::departmentId:', []);
      
      const contactData = testUtils.createTestContact();
      
      const response = await request
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData);
      
      expect(response.status).toBe(201);
      
      // 验证缓存是否被清除
      const cached = await CacheUtil.get('contacts:list:page:1:limit:20:search::status::departmentId:');
      expect(cached).toBeNull();
    });
  });

  describe('PUT /api/contacts/:id', () => {
    let contact;
    
    beforeEach(async () => {
      contact = await Contact.create(testUtils.createTestContact());
    });

    test('应该成功更新联系人', async () => {
      const updateData = {
        name: '更新后的姓名',
        position: '高级工程师'
      };
      
      const response = await request
        .put(`/api/contacts/${contact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.position).toBe(updateData.position);
      
      // 验证数据库中是否更新成功
      await contact.reload();
      expect(contact.name).toBe(updateData.name);
      expect(contact.position).toBe(updateData.position);
    });

    test('联系人不存在时应该返回404', async () => {
      const response = await request
        .put('/api/contacts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '新姓名' });
      
      expect(response.status).toBe(404);
      expectError(response, 404, '联系人不存在');
    });

    test('应该验证更新数据', async () => {
      const response = await request
        .put(`/api/contacts/${contact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid-email' });
      
      expect(response.status).toBe(400);
      expectError(response, 400);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    let contact;
    
    beforeEach(async () => {
      contact = await Contact.create(testUtils.createTestContact());
    });

    test('应该成功删除联系人', async () => {
      const response = await request
        .delete(`/api/contacts/${contact.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      
      // 验证数据库中是否删除成功
      const deleted = await Contact.findByPk(contact.id);
      expect(deleted).toBeNull();
    });

    test('联系人不存在时应该返回404', async () => {
      const response = await request
        .delete('/api/contacts/99999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
      expectError(response, 404, '联系人不存在');
    });
  });

  describe('POST /api/contacts/batch', () => {
    test('应该成功批量导入联系人', async () => {
      const contactsData = [
        testUtils.createTestContact({ userId: 'batch1', name: '批量用户1' }),
        testUtils.createTestContact({ userId: 'batch2', name: '批量用户2' }),
        testUtils.createTestContact({ userId: 'batch3', name: '批量用户3' })
      ];
      
      const response = await request
        .post('/api/contacts/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ contacts: contactsData });
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data.success).toBe(3);
      expect(response.body.data.failed).toBe(0);
      
      // 验证数据库中是否创建成功
      const created = await Contact.findAll({
        where: {
          userId: ['batch1', 'batch2', 'batch3']
        }
      });
      expect(created).toHaveLength(3);
    });

    test('应该处理部分失败的情况', async () => {
      // 先创建一个联系人
      await Contact.create(testUtils.createTestContact({ userId: 'existing' }));
      
      const contactsData = [
        testUtils.createTestContact({ userId: 'new1', name: '新用户1' }),
        testUtils.createTestContact({ userId: 'existing', name: '重复用户' }), // 重复
        testUtils.createTestContact({ userId: 'new2', name: '新用户2' })
      ];
      
      const response = await request
        .post('/api/contacts/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ contacts: contactsData });
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data.success).toBe(2);
      expect(response.body.data.failed).toBe(1);
      expect(response.body.data.errors).toHaveLength(1);
    });

    test('应该验证批量数据', async () => {
      const response = await request
        .post('/api/contacts/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ contacts: [] });
      
      expect(response.status).toBe(400);
      expectError(response, 400, '联系人数据不能为空');
    });
  });

  describe('POST /api/contacts/sync', () => {
    test('应该同步企业微信通讯录', async () => {
      // 模拟企业微信API响应
      const mockAxios = require('axios');
      mockAxios.get = jest.fn()
        .mockResolvedValueOnce({ data: mockWeworkApi.mockGetAccessToken() })
        .mockResolvedValueOnce({ data: mockWeworkApi.mockGetDepartments() })
        .mockResolvedValueOnce({ data: mockWeworkApi.mockGetDepartmentUsers() });
      
      const response = await request
        .post('/api/contacts/sync')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data.synced).toBeGreaterThan(0);
    });

    test('API错误时应该返回500', async () => {
      // 模拟API错误
      const mockAxios = require('axios');
      mockAxios.get = jest.fn().mockRejectedValue(new Error('API错误'));
      
      const response = await request
        .post('/api/contacts/sync')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(500);
      expectError(response, 500);
    });
  });

  describe('API密钥认证', () => {
    test('应该支持API密钥认证', async () => {
      const response = await request
        .get('/api/contacts')
        .set('X-API-Key', apiKey);
      
      expect(response.status).toBe(200);
      expectSuccess(response);
    });

    test('无效API密钥应该返回403', async () => {
      const response = await request
        .get('/api/contacts')
        .set('X-API-Key', 'invalid-key');
      
      expect(response.status).toBe(403);
      expectError(response, 403, 'API密钥无效');
    });
  });

  describe('速率限制', () => {
    test('应该限制请求频率', async () => {
      const promises = [];
      
      // 发送大量请求
      for (let i = 0; i < 1100; i++) {
        promises.push(
          request
            .get('/api/contacts')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }
      
      const responses = await Promise.all(promises);
      
      // 应该有一些请求被限制
      const rateLimited = responses.filter(res => res.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('错误处理', () => {
    test('应该处理数据库连接错误', async () => {
      // 模拟数据库错误
      const originalFindAll = Contact.findAll;
      Contact.findAll = jest.fn().mockRejectedValue(new Error('数据库连接失败'));
      
      const response = await request
        .get('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(500);
      expectError(response, 500);
      
      // 恢复原方法
      Contact.findAll = originalFindAll;
    });

    test('应该处理JSON解析错误', async () => {
      const response = await request
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json');
      
      expect(response.status).toBe(400);
    });
  });
});