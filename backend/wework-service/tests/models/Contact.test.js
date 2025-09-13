/**
 * Contact模型测试
 */

const { Contact, Department } = require('../../src/models');

describe('Contact Model', () => {
  let testDepartment;
  
  beforeEach(async () => {
    // 创建测试部门
    testDepartment = await Department.create(testUtils.createTestDepartment());
  });

  describe('创建联系人', () => {
    test('应该成功创建联系人', async () => {
      const contactData = testUtils.createTestContact();
      const contact = await Contact.create(contactData);
      
      expect(contact.id).toBeDefined();
      expect(contact.userId).toBe(contactData.userId);
      expect(contact.name).toBe(contactData.name);
      expect(contact.mobile).toBe(contactData.mobile);
      expect(contact.email).toBe(contactData.email);
      expect(contact.status).toBe(contactData.status);
    });

    test('应该验证必填字段', async () => {
      await expect(Contact.create({})).rejects.toThrow();
    });

    test('应该验证userId唯一性', async () => {
      const contactData = testUtils.createTestContact();
      await Contact.create(contactData);
      
      await expect(Contact.create(contactData)).rejects.toThrow();
    });

    test('应该验证手机号格式', async () => {
      const contactData = testUtils.createTestContact({
        mobile: '123456789' // 无效手机号
      });
      
      await expect(Contact.create(contactData)).rejects.toThrow();
    });

    test('应该验证邮箱格式', async () => {
      const contactData = testUtils.createTestContact({
        email: 'invalid-email' // 无效邮箱
      });
      
      await expect(Contact.create(contactData)).rejects.toThrow();
    });
  });

  describe('查询联系人', () => {
    let contact;
    
    beforeEach(async () => {
      contact = await Contact.create(testUtils.createTestContact());
    });

    test('应该能通过ID查找联系人', async () => {
      const found = await Contact.findByPk(contact.id);
      
      expect(found).toBeTruthy();
      expect(found.userId).toBe(contact.userId);
    });

    test('应该能通过userId查找联系人', async () => {
      const found = await Contact.findOne({
        where: { userId: contact.userId }
      });
      
      expect(found).toBeTruthy();
      expect(found.id).toBe(contact.id);
    });

    test('应该能按状态筛选联系人', async () => {
      // 创建不同状态的联系人
      await Contact.create(testUtils.createTestContact({
        userId: 'inactive_user',
        status: 0
      }));
      
      const activeContacts = await Contact.findAll({
        where: { status: 1 }
      });
      
      expect(activeContacts).toHaveLength(1);
      expect(activeContacts[0].userId).toBe(contact.userId);
    });
  });

  describe('更新联系人', () => {
    let contact;
    
    beforeEach(async () => {
      contact = await Contact.create(testUtils.createTestContact());
    });

    test('应该能更新联系人信息', async () => {
      const newName = '更新后的姓名';
      const newPosition = '高级工程师';
      
      await contact.update({
        name: newName,
        position: newPosition
      });
      
      expect(contact.name).toBe(newName);
      expect(contact.position).toBe(newPosition);
    });

    test('应该自动更新updatedAt字段', async () => {
      const originalUpdatedAt = contact.updatedAt;
      
      await testUtils.sleep(1000); // 等待1秒
      
      await contact.update({ name: '新姓名' });
      
      expect(contact.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('删除联系人', () => {
    let contact;
    
    beforeEach(async () => {
      contact = await Contact.create(testUtils.createTestContact());
    });

    test('应该能删除联系人', async () => {
      await contact.destroy();
      
      const found = await Contact.findByPk(contact.id);
      expect(found).toBeNull();
    });
  });

  describe('关联关系', () => {
    let contact;
    
    beforeEach(async () => {
      contact = await Contact.create(testUtils.createTestContact());
    });

    test('应该能关联部门', async () => {
      await contact.addDepartment(testDepartment);
      
      const departments = await contact.getDepartments();
      expect(departments).toHaveLength(1);
      expect(departments[0].id).toBe(testDepartment.id);
    });

    test('应该能移除部门关联', async () => {
      await contact.addDepartment(testDepartment);
      await contact.removeDepartment(testDepartment);
      
      const departments = await contact.getDepartments();
      expect(departments).toHaveLength(0);
    });
  });

  describe('实例方法', () => {
    let contact;
    
    beforeEach(async () => {
      contact = await Contact.create(testUtils.createTestContact());
    });

    test('getFullInfo应该返回完整信息', async () => {
      await contact.addDepartment(testDepartment);
      
      const fullInfo = await contact.getFullInfo();
      
      expect(fullInfo.id).toBe(contact.id);
      expect(fullInfo.departments).toHaveLength(1);
      expect(fullInfo.departments[0].name).toBe(testDepartment.name);
    });

    test('updateLastActiveTime应该更新最后活跃时间', async () => {
      const originalTime = contact.lastActiveTime;
      
      await testUtils.sleep(1000);
      await contact.updateLastActiveTime();
      
      expect(contact.lastActiveTime.getTime()).toBeGreaterThan(
        originalTime ? originalTime.getTime() : 0
      );
    });

    test('isActive应该正确判断活跃状态', () => {
      expect(contact.isActive()).toBe(true);
      
      contact.status = 0;
      expect(contact.isActive()).toBe(false);
    });
  });

  describe('类方法', () => {
    beforeEach(async () => {
      // 创建多个测试联系人
      await Contact.bulkCreate([
        testUtils.createTestContact({ userId: 'user1', name: '张三' }),
        testUtils.createTestContact({ userId: 'user2', name: '李四' }),
        testUtils.createTestContact({ userId: 'user3', name: '王五', status: 0 })
      ]);
    });

    test('findByDepartment应该返回部门成员', async () => {
      const contacts = await Contact.findAll();
      await contacts[0].addDepartment(testDepartment);
      await contacts[1].addDepartment(testDepartment);
      
      const departmentContacts = await Contact.findByDepartment(testDepartment.id);
      
      expect(departmentContacts).toHaveLength(2);
    });

    test('searchByKeyword应该支持关键词搜索', async () => {
      const results = await Contact.searchByKeyword('张三');
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('张三');
    });

    test('getActiveContacts应该只返回活跃联系人', async () => {
      const activeContacts = await Contact.getActiveContacts();
      
      expect(activeContacts).toHaveLength(2);
      activeContacts.forEach(contact => {
        expect(contact.status).toBe(1);
      });
    });

    test('getStatistics应该返回统计信息', async () => {
      const stats = await Contact.getStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
    });
  });

  describe('数据验证', () => {
    test('应该验证性别字段', async () => {
      const contactData = testUtils.createTestContact({
        gender: '3' // 无效性别
      });
      
      await expect(Contact.create(contactData)).rejects.toThrow();
    });

    test('应该验证状态字段', async () => {
      const contactData = testUtils.createTestContact({
        status: 5 // 无效状态
      });
      
      await expect(Contact.create(contactData)).rejects.toThrow();
    });

    test('应该验证头像URL格式', async () => {
      const contactData = testUtils.createTestContact({
        avatar: 'invalid-url'
      });
      
      await expect(Contact.create(contactData)).rejects.toThrow();
    });
  });

  describe('并发操作', () => {
    test('应该处理并发创建', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          Contact.create(testUtils.createTestContact({
            userId: `concurrent_user_${i}`,
            name: `并发用户${i}`
          }))
        );
      }
      
      const contacts = await Promise.all(promises);
      
      expect(contacts).toHaveLength(10);
      
      const allContacts = await Contact.findAll();
      expect(allContacts).toHaveLength(10);
    });

    test('应该处理并发更新', async () => {
      const contact = await Contact.create(testUtils.createTestContact());
      
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          contact.update({ name: `更新姓名${i}` })
        );
      }
      
      await Promise.all(promises);
      
      const updated = await Contact.findByPk(contact.id);
      expect(updated.name).toMatch(/更新姓名\d/);
    });
  });
});