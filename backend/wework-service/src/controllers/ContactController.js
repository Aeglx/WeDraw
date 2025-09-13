/**
 * 企业微信通讯录控制器
 */

const BaseController = require('./BaseController');
const { Contact, Department } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

class ContactController extends BaseController {
  constructor() {
    super();
  }

  /**
   * 获取通讯录列表
   */
  getContacts = this.asyncHandler(async (req, res) => {
    const { page, limit, offset } = this.getPaginationParams(req.query);
    const order = this.getSortParams(req.query, ['name', 'mobile', 'email', 'position', 'created_at']);
    const searchCondition = this.getSearchParams(req.query, ['name', 'mobile', 'email', 'position']);
    const dateCondition = this.getDateRangeParams(req.query);

    const where = {
      ...searchCondition,
      ...dateCondition
    };

    // 部门筛选
    if (req.query.department_id) {
      where.department_id = req.query.department_id;
    }

    // 状态筛选
    if (req.query.status) {
      where.status = req.query.status;
    }

    // 是否启用筛选
    if (req.query.is_enabled !== undefined) {
      where.is_enabled = req.query.is_enabled === 'true';
    }

    const { count, rows } = await Contact.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: [{
        model: Department,
        as: 'departments',
        through: { attributes: [] }
      }]
    });

    const pagination = {
      page,
      limit,
      total: count
    };

    return this.paginatedResponse(res, rows, pagination, '获取通讯录列表成功');
  });

  /**
   * 获取联系人详情
   */
  getContact = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const contact = await Contact.findByPk(id, {
      include: [{
        model: Department,
        as: 'departments',
        through: { attributes: [] }
      }]
    });

    if (!contact) {
      return this.notFoundResponse(res, '联系人不存在');
    }

    return this.successResponse(res, contact, '获取联系人详情成功');
  });

  /**
   * 创建联系人
   */
  createContact = this.asyncHandler(async (req, res) => {
    const {
      wework_user_id,
      name,
      mobile,
      email,
      position,
      gender,
      avatar,
      telephone,
      alias,
      address,
      open_userid,
      main_department,
      department_ids = [],
      order_in_departments = [],
      is_leader_in_departments = [],
      direct_leader = [],
      enable = 1,
      hide_mobile = false,
      english_name,
      external_profile = {},
      external_position,
      qr_code,
      to_invite = true,
      send_invite = true
    } = req.body;

    // 验证必需字段
    const requiredErrors = this.validateRequired(req.body, ['wework_user_id', 'name']);
    if (requiredErrors.length > 0) {
      return this.validationErrorResponse(res, requiredErrors);
    }

    // 验证字段长度
    const lengthErrors = this.validateLength(req.body, {
      name: { min: 1, max: 64 },
      mobile: { min: 11, max: 11 },
      email: { max: 64 },
      position: { max: 128 },
      alias: { max: 32 },
      english_name: { max: 64 }
    });
    if (lengthErrors.length > 0) {
      return this.validationErrorResponse(res, lengthErrors);
    }

    // 验证邮箱格式
    if (email && !this.validateEmail(email)) {
      return this.validationErrorResponse(res, [{
        field: 'email',
        message: '邮箱格式不正确'
      }]);
    }

    // 验证手机号格式
    if (mobile && !this.validateMobile(mobile)) {
      return this.validationErrorResponse(res, [{
        field: 'mobile',
        message: '手机号格式不正确'
      }]);
    }

    // 检查用户ID是否已存在
    const existingContact = await Contact.findOne({
      where: { wework_user_id }
    });

    if (existingContact) {
      return this.errorResponse(res, '用户ID已存在', 400);
    }

    try {
      // 创建联系人
      const contact = await Contact.create({
        wework_user_id,
        name,
        mobile,
        email,
        position,
        gender,
        avatar,
        telephone,
        alias,
        address,
        open_userid,
        main_department,
        order_in_departments,
        is_leader_in_departments,
        direct_leader,
        enable,
        hide_mobile,
        english_name,
        external_profile,
        external_position,
        qr_code,
        to_invite,
        send_invite,
        status: 'active',
        is_enabled: true
      });

      // 关联部门
      if (department_ids.length > 0) {
        const departments = await Department.findAll({
          where: { id: department_ids }
        });
        await contact.setDepartments(departments);
      }

      // 重新获取包含关联数据的联系人
      const createdContact = await Contact.findByPk(contact.id, {
        include: [{
          model: Department,
          as: 'departments',
          through: { attributes: [] }
        }]
      });

      this.logAction('CREATE_CONTACT', { contact_id: contact.id }, req);

      return this.successResponse(res, createdContact, '创建联系人成功', 201);
    } catch (error) {
      console.error('创建联系人失败:', error);
      return this.errorResponse(res, '创建联系人失败', 500, error.message);
    }
  });

  /**
   * 更新联系人
   */
  updateContact = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return this.notFoundResponse(res, '联系人不存在');
    }

    // 验证字段长度
    const lengthErrors = this.validateLength(updateData, {
      name: { min: 1, max: 64 },
      mobile: { min: 11, max: 11 },
      email: { max: 64 },
      position: { max: 128 },
      alias: { max: 32 },
      english_name: { max: 64 }
    });
    if (lengthErrors.length > 0) {
      return this.validationErrorResponse(res, lengthErrors);
    }

    // 验证邮箱格式
    if (updateData.email && !this.validateEmail(updateData.email)) {
      return this.validationErrorResponse(res, [{
        field: 'email',
        message: '邮箱格式不正确'
      }]);
    }

    // 验证手机号格式
    if (updateData.mobile && !this.validateMobile(updateData.mobile)) {
      return this.validationErrorResponse(res, [{
        field: 'mobile',
        message: '手机号格式不正确'
      }]);
    }

    try {
      // 更新联系人
      await contact.update(updateData);

      // 更新部门关联
      if (updateData.department_ids) {
        const departments = await Department.findAll({
          where: { id: updateData.department_ids }
        });
        await contact.setDepartments(departments);
      }

      // 重新获取包含关联数据的联系人
      const updatedContact = await Contact.findByPk(contact.id, {
        include: [{
          model: Department,
          as: 'departments',
          through: { attributes: [] }
        }]
      });

      this.logAction('UPDATE_CONTACT', { contact_id: contact.id, changes: updateData }, req);

      return this.successResponse(res, updatedContact, '更新联系人成功');
    } catch (error) {
      console.error('更新联系人失败:', error);
      return this.errorResponse(res, '更新联系人失败', 500, error.message);
    }
  });

  /**
   * 删除联系人
   */
  deleteContact = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return this.notFoundResponse(res, '联系人不存在');
    }

    try {
      await contact.destroy();

      this.logAction('DELETE_CONTACT', { contact_id: id }, req);

      return this.successResponse(res, null, '删除联系人成功');
    } catch (error) {
      console.error('删除联系人失败:', error);
      return this.errorResponse(res, '删除联系人失败', 500, error.message);
    }
  });

  /**
   * 批量导入联系人
   */
  batchImportContacts = this.asyncHandler(async (req, res) => {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return this.validationErrorResponse(res, [{
        field: 'contacts',
        message: '联系人列表不能为空'
      }]);
    }

    const results = {
      success: [],
      failed: []
    };

    for (const contactData of contacts) {
      try {
        // 验证必需字段
        const requiredErrors = this.validateRequired(contactData, ['wework_user_id', 'name']);
        if (requiredErrors.length > 0) {
          results.failed.push({
            data: contactData,
            errors: requiredErrors
          });
          continue;
        }

        // 检查用户ID是否已存在
        const existingContact = await Contact.findOne({
          where: { wework_user_id: contactData.wework_user_id }
        });

        if (existingContact) {
          results.failed.push({
            data: contactData,
            errors: [{ message: '用户ID已存在' }]
          });
          continue;
        }

        // 创建联系人
        const contact = await Contact.create({
          ...contactData,
          status: 'active',
          is_enabled: true
        });

        results.success.push(contact);
      } catch (error) {
        results.failed.push({
          data: contactData,
          errors: [{ message: error.message }]
        });
      }
    }

    this.logAction('BATCH_IMPORT_CONTACTS', {
      total: contacts.length,
      success: results.success.length,
      failed: results.failed.length
    }, req);

    return this.successResponse(res, results, '批量导入完成');
  });

  /**
   * 同步企业微信通讯录
   */
  syncFromWework = this.asyncHandler(async (req, res) => {
    try {
      // 这里需要调用企业微信API获取通讯录数据
      // 实际实现需要根据企业微信API文档来完成
      
      const accessToken = await this.getWeworkAccessToken();
      if (!accessToken) {
        return this.errorResponse(res, '获取企业微信访问令牌失败', 500);
      }

      // 获取部门列表
      const departments = await this.getWeworkDepartments(accessToken);
      
      // 获取用户列表
      const users = await this.getWeworkUsers(accessToken);

      const syncResults = {
        departments: { created: 0, updated: 0, failed: 0 },
        contacts: { created: 0, updated: 0, failed: 0 }
      };

      // 同步部门
      for (const deptData of departments) {
        try {
          const [department, created] = await Department.findOrCreate({
            where: { wework_dept_id: deptData.id },
            defaults: {
              name: deptData.name,
              name_en: deptData.name_en,
              parent_id: deptData.parentid === 1 ? null : deptData.parentid,
              order: deptData.order,
              wework_dept_id: deptData.id
            }
          });

          if (created) {
            syncResults.departments.created++;
          } else {
            await department.update({
              name: deptData.name,
              name_en: deptData.name_en,
              order: deptData.order
            });
            syncResults.departments.updated++;
          }
        } catch (error) {
          console.error('同步部门失败:', error);
          syncResults.departments.failed++;
        }
      }

      // 同步联系人
      for (const userData of users) {
        try {
          const [contact, created] = await Contact.findOrCreate({
            where: { wework_user_id: userData.userid },
            defaults: {
              name: userData.name,
              mobile: userData.mobile,
              email: userData.email,
              position: userData.position,
              gender: userData.gender,
              avatar: userData.avatar,
              telephone: userData.telephone,
              alias: userData.alias,
              address: userData.address,
              open_userid: userData.open_userid,
              main_department: userData.main_department,
              wework_user_id: userData.userid,
              status: userData.status === 1 ? 'active' : 'inactive',
              is_enabled: userData.enable === 1
            }
          });

          if (created) {
            syncResults.contacts.created++;
          } else {
            await contact.update({
              name: userData.name,
              mobile: userData.mobile,
              email: userData.email,
              position: userData.position,
              avatar: userData.avatar,
              status: userData.status === 1 ? 'active' : 'inactive',
              is_enabled: userData.enable === 1
            });
            syncResults.contacts.updated++;
          }
        } catch (error) {
          console.error('同步联系人失败:', error);
          syncResults.contacts.failed++;
        }
      }

      this.logAction('SYNC_FROM_WEWORK', syncResults, req);

      return this.successResponse(res, syncResults, '同步企业微信通讯录成功');
    } catch (error) {
      console.error('同步企业微信通讯录失败:', error);
      return this.errorResponse(res, '同步失败', 500, error.message);
    }
  });

  /**
   * 获取企业微信访问令牌
   */
  async getWeworkAccessToken() {
    try {
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
        params: {
          corpid: process.env.WEWORK_CORP_ID,
          corpsecret: process.env.WEWORK_CONTACT_SECRET
        }
      });

      if (response.data.errcode === 0) {
        return response.data.access_token;
      } else {
        console.error('获取访问令牌失败:', response.data);
        return null;
      }
    } catch (error) {
      console.error('获取访问令牌异常:', error);
      return null;
    }
  }

  /**
   * 获取企业微信部门列表
   */
  async getWeworkDepartments(accessToken) {
    try {
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/department/list', {
        params: {
          access_token: accessToken
        }
      });

      if (response.data.errcode === 0) {
        return response.data.department || [];
      } else {
        console.error('获取部门列表失败:', response.data);
        return [];
      }
    } catch (error) {
      console.error('获取部门列表异常:', error);
      return [];
    }
  }

  /**
   * 获取企业微信用户列表
   */
  async getWeworkUsers(accessToken) {
    try {
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/user/list', {
        params: {
          access_token: accessToken,
          department_id: 1,
          fetch_child: 1
        }
      });

      if (response.data.errcode === 0) {
        return response.data.userlist || [];
      } else {
        console.error('获取用户列表失败:', response.data);
        return [];
      }
    } catch (error) {
      console.error('获取用户列表异常:', error);
      return [];
    }
  }
}

module.exports = new ContactController();