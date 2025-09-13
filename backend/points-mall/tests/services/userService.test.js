const userService = require('../../src/services/userService');
const { User, PointsAccount } = require('../../src/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        phone: '13900139000'
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.phone).toBe(userData.phone);
      expect(user.password).not.toBe(userData.password); // 应该被加密

      // 验证积分账户是否创建
      const pointsAccount = await PointsAccount.findOne({ where: { user_id: user.id } });
      expect(pointsAccount).toBeDefined();
      expect(pointsAccount.total_points).toBe(0);
    });

    it('should throw error for duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123',
        phone: '13900139001'
      };

      // 先创建一个用户
      await createTestUser();

      // 尝试创建重复用户名的用户
      await expect(userService.createUser({
        ...userData,
        username: 'testuser'
      })).rejects.toThrow();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        username: 'newuser2',
        email: 'test@example.com',
        password: 'password123',
        phone: '13900139002'
      };

      // 先创建一个用户
      await createTestUser();

      // 尝试创建重复邮箱的用户
      await expect(userService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('validateLogin', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('should validate login with correct credentials', async () => {
      const result = await userService.validateLogin('testuser', 'password123');

      expect(result).toBeDefined();
      expect(result.id).toBe(testUser.id);
      expect(result.username).toBe(testUser.username);
    });

    it('should throw error for incorrect password', async () => {
      await expect(
        userService.validateLogin('testuser', 'wrongpassword')
      ).rejects.toThrow('用户名或密码错误');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        userService.validateLogin('nonexistent', 'password123')
      ).rejects.toThrow('用户名或密码错误');
    });

    it('should throw error for inactive user', async () => {
      await testUser.update({ status: 'inactive' });

      await expect(
        userService.validateLogin('testuser', 'password123')
      ).rejects.toThrow('账户已被禁用');
    });
  });

  describe('generateTokens', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('should generate access and refresh tokens', async () => {
      const tokens = await userService.generateTokens(testUser.id);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');

      // 验证token内容
      const accessPayload = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      expect(accessPayload.userId).toBe(testUser.id);
      expect(accessPayload.type).toBe('access');

      const refreshPayload = jwt.verify(tokens.refreshToken, process.env.JWT_SECRET);
      expect(refreshPayload.userId).toBe(testUser.id);
      expect(refreshPayload.type).toBe('refresh');
    });
  });

  describe('getUserById', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('should return user by id', async () => {
      const user = await userService.getUserById(testUser.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
      expect(user.username).toBe(testUser.username);
      expect(user.password).toBeUndefined(); // 密码不应该返回
    });

    it('should return null for non-existent user', async () => {
      const user = await userService.getUserById(99999);
      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('should update user information', async () => {
      const updateData = {
        nickname: '新昵称',
        phone: '13800138001'
      };

      const updatedUser = await userService.updateUser(testUser.id, updateData);

      expect(updatedUser.nickname).toBe(updateData.nickname);
      expect(updatedUser.phone).toBe(updateData.phone);
    });

    it('should not update sensitive fields', async () => {
      const updateData = {
        password: 'newpassword',
        status: 'inactive'
      };

      const updatedUser = await userService.updateUser(testUser.id, updateData);

      // 验证密码没有被直接更新
      const isPasswordSame = await bcrypt.compare('password123', updatedUser.password);
      expect(isPasswordSame).toBe(true);
    });
  });

  describe('changePassword', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('should change password with correct old password', async () => {
      await userService.changePassword(testUser.id, 'password123', 'newpassword123');

      // 验证新密码
      const updatedUser = await User.findByPk(testUser.id);
      const isNewPasswordValid = await bcrypt.compare('newpassword123', updatedUser.password);
      expect(isNewPasswordValid).toBe(true);
    });

    it('should throw error for incorrect old password', async () => {
      await expect(
        userService.changePassword(testUser.id, 'wrongpassword', 'newpassword123')
      ).rejects.toThrow('原密码错误');
    });
  });
});