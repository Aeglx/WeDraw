const request = require('supertest');
const app = require('../../server');
const { User, PointsAccount } = require('../../src/models');

describe('UserController', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        phone: '13900139000'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // 验证用户已创建
      const user = await User.findOne({ where: { username: userData.username } });
      expect(user).toBeDefined();

      // 验证积分账户已创建
      const pointsAccount = await PointsAccount.findOne({ where: { user_id: user.id } });
      expect(pointsAccount).toBeDefined();
    });

    it('should return error for duplicate username', async () => {
      // 先创建一个用户
      await createTestUser();

      const userData = {
        username: 'testuser',
        email: 'new@example.com',
        password: 'password123',
        phone: '13900139001'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名已存在');
    });

    it('should return error for invalid input', async () => {
      const userData = {
        username: 'ab', // 用户名太短
        email: 'invalid-email',
        password: '123', // 密码太短
        phone: '123' // 手机号格式错误
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/users/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should return error for incorrect password', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名或密码错误');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名或密码错误');
    });
  });

  describe('GET /api/users/profile', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateTestToken(testUser.id);
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.username).toBe(testUser.username);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的令牌');
    });
  });

  describe('PUT /api/users/profile', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateTestToken(testUser.id);
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        nickname: '新昵称',
        phone: '13800138001'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nickname).toBe(updateData.nickname);
      expect(response.body.data.phone).toBe(updateData.phone);

      // 验证数据库中的数据已更新
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.nickname).toBe(updateData.nickname);
      expect(updatedUser.phone).toBe(updateData.phone);
    });

    it('should return error for invalid phone format', async () => {
      const updateData = {
        phone: '123456' // 无效的手机号格式
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/users/change-password', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateTestToken(testUser.id);
    });

    it('should change password successfully', async () => {
      const passwordData = {
        oldPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('密码修改成功');

      // 验证可以用新密码登录
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          username: testUser.username,
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should return error for incorrect old password', async () => {
      const passwordData = {
        oldPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('原密码错误');
    });
  });

  describe('GET /api/users/points', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateTestToken(testUser.id);
      
      // 设置用户积分
      await PointsAccount.update(
        { 
          total_points: 1000,
          available_points: 800,
          frozen_points: 200
        },
        { where: { user_id: testUser.id } }
      );
    });

    it('should return user points information', async () => {
      const response = await request(app)
        .get('/api/users/points')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_points).toBe(1000);
      expect(response.body.data.available_points).toBe(800);
      expect(response.body.data.frozen_points).toBe(200);
    });
  });
});