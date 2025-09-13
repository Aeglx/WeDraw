/**
 * 企业微信群组控制器
 */

const BaseController = require('./BaseController');
const { Group, Contact, Bot, Message } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

class GroupController extends BaseController {
  constructor() {
    super();
  }

  /**
   * 获取群组列表
   */
  getGroups = this.asyncHandler(async (req, res) => {
    const { page, limit, offset } = this.getPaginationParams(req.query);
    const order = this.getSortParams(req.query, ['name', 'member_count', 'created_at']);
    const searchCondition = this.getSearchParams(req.query, ['name', 'description']);
    const dateCondition = this.getDateRangeParams(req.query);

    const where = {
      ...searchCondition,
      ...dateCondition
    };

    // 群组类型筛选
    if (req.query.group_type) {
      where.group_type = req.query.group_type;
    }

    // 状态筛选
    if (req.query.status) {
      where.status = req.query.status;
    }

    // 是否启用筛选
    if (req.query.is_enabled !== undefined) {
      where.is_enabled = req.query.is_enabled === 'true';
    }

    const { count, rows } = await Group.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: [{
        model: Contact,
        as: 'members',
        through: { attributes: ['role', 'joined_at'] },
        attributes: ['id', 'name', 'avatar', 'wework_user_id']
      }, {
        model: Bot,
        as: 'bots',
        attributes: ['id', 'name', 'avatar', 'status']
      }]
    });

    const pagination = {
      page,
      limit,
      total: count
    };

    return this.paginatedResponse(res, rows, pagination, '获取群组列表成功');
  });

  /**
   * 获取群组详情
   */
  getGroup = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const group = await Group.findByPk(id, {
      include: [{
        model: Contact,
        as: 'members',
        through: { attributes: ['role', 'joined_at'] }
      }, {
        model: Bot,
        as: 'bots'
      }]
    });

    if (!group) {
      return this.notFoundResponse(res, '群组不存在');
    }

    return this.successResponse(res, group, '获取群组详情成功');
  });

  /**
   * 创建群组
   */
  createGroup = this.asyncHandler(async (req, res) => {
    const {
      name,
      description,
      wework_chat_id,
      group_type = 'internal',
      avatar,
      notice,
      owner_id,
      admin_list = [],
      member_list = [],
      max_members = 500,
      join_scene,
      chat_type,
      settings = {}
    } = req.body;

    // 验证必需字段
    const requiredErrors = this.validateRequired(req.body, ['name']);
    if (requiredErrors.length > 0) {
      return this.validationErrorResponse(res, requiredErrors);
    }

    // 验证字段长度
    const lengthErrors = this.validateLength(req.body, {
      name: { min: 1, max: 50 },
      description: { max: 500 },
      notice: { max: 1000 }
    });
    if (lengthErrors.length > 0) {
      return this.validationErrorResponse(res, lengthErrors);
    }

    // 检查群组名称是否已存在
    const existingGroup = await Group.findOne({
      where: { name }
    });

    if (existingGroup) {
      return this.errorResponse(res, '群组名称已存在', 400);
    }

    try {
      // 创建群组
      const group = await Group.create({
        name,
        description,
        wework_chat_id,
        group_type,
        avatar,
        notice,
        owner_id,
        admin_list,
        member_list,
        max_members,
        join_scene,
        chat_type,
        settings,
        member_count: member_list.length,
        status: 'active',
        is_enabled: true
      });

      // 添加成员
      if (member_list.length > 0) {
        const contacts = await Contact.findAll({
          where: { wework_user_id: member_list }
        });
        
        const memberData = contacts.map(contact => ({
          GroupId: group.id,
          ContactId: contact.id,
          role: admin_list.includes(contact.wework_user_id) ? 'admin' : 'member',
          joined_at: new Date()
        }));

        await group.addMembers(contacts, {
          through: memberData.reduce((acc, data) => {
            acc[data.ContactId] = {
              role: data.role,
              joined_at: data.joined_at
            };
            return acc;
          }, {})
        });
      }

      // 重新获取包含关联数据的群组
      const createdGroup = await Group.findByPk(group.id, {
        include: [{
          model: Contact,
          as: 'members',
          through: { attributes: ['role', 'joined_at'] }
        }]
      });

      this.logAction('CREATE_GROUP', { group_id: group.id }, req);

      return this.successResponse(res, createdGroup, '创建群组成功', 201);
    } catch (error) {
      console.error('创建群组失败:', error);
      return this.errorResponse(res, '创建群组失败', 500, error.message);
    }
  });

  /**
   * 更新群组
   */
  updateGroup = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const group = await Group.findByPk(id);
    if (!group) {
      return this.notFoundResponse(res, '群组不存在');
    }

    // 验证字段长度
    const lengthErrors = this.validateLength(updateData, {
      name: { min: 1, max: 50 },
      description: { max: 500 },
      notice: { max: 1000 }
    });
    if (lengthErrors.length > 0) {
      return this.validationErrorResponse(res, lengthErrors);
    }

    // 检查群组名称是否已存在（排除当前群组）
    if (updateData.name && updateData.name !== group.name) {
      const existingGroup = await Group.findOne({
        where: {
          name: updateData.name,
          id: { [Op.ne]: id }
        }
      });

      if (existingGroup) {
        return this.errorResponse(res, '群组名称已存在', 400);
      }
    }

    try {
      // 更新群组
      await group.update(updateData);

      // 重新获取包含关联数据的群组
      const updatedGroup = await Group.findByPk(group.id, {
        include: [{
          model: Contact,
          as: 'members',
          through: { attributes: ['role', 'joined_at'] }
        }, {
          model: Bot,
          as: 'bots'
        }]
      });

      this.logAction('UPDATE_GROUP', { group_id: group.id, changes: updateData }, req);

      return this.successResponse(res, updatedGroup, '更新群组成功');
    } catch (error) {
      console.error('更新群组失败:', error);
      return this.errorResponse(res, '更新群组失败', 500, error.message);
    }
  });

  /**
   * 删除群组
   */
  deleteGroup = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const group = await Group.findByPk(id);
    if (!group) {
      return this.notFoundResponse(res, '群组不存在');
    }

    try {
      await group.destroy();

      this.logAction('DELETE_GROUP', { group_id: id }, req);

      return this.successResponse(res, null, '删除群组成功');
    } catch (error) {
      console.error('删除群组失败:', error);
      return this.errorResponse(res, '删除群组失败', 500, error.message);
    }
  });

  /**
   * 添加群成员
   */
  addMembers = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { member_list = [], admin_list = [] } = req.body;

    if (!Array.isArray(member_list) || member_list.length === 0) {
      return this.validationErrorResponse(res, [{
        field: 'member_list',
        message: '成员列表不能为空'
      }]);
    }

    const group = await Group.findByPk(id);
    if (!group) {
      return this.notFoundResponse(res, '群组不存在');
    }

    try {
      // 获取要添加的联系人
      const contacts = await Contact.findAll({
        where: { wework_user_id: member_list }
      });

      if (contacts.length === 0) {
        return this.errorResponse(res, '未找到有效的联系人', 400);
      }

      // 检查群组成员数量限制
      const currentMemberCount = await group.countMembers();
      if (currentMemberCount + contacts.length > group.max_members) {
        return this.errorResponse(res, '超出群组最大成员数量限制', 400);
      }

      // 添加成员
      const memberData = {};
      contacts.forEach(contact => {
        memberData[contact.id] = {
          role: admin_list.includes(contact.wework_user_id) ? 'admin' : 'member',
          joined_at: new Date()
        };
      });

      await group.addMembers(contacts, { through: memberData });

      // 更新群组成员数量
      const newMemberCount = await group.countMembers();
      await group.update({ member_count: newMemberCount });

      this.logAction('ADD_GROUP_MEMBERS', {
        group_id: id,
        added_members: member_list,
        admin_members: admin_list
      }, req);

      return this.successResponse(res, {
        added_count: contacts.length,
        total_members: newMemberCount
      }, '添加群成员成功');
    } catch (error) {
      console.error('添加群成员失败:', error);
      return this.errorResponse(res, '添加群成员失败', 500, error.message);
    }
  });

  /**
   * 移除群成员
   */
  removeMembers = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { member_list = [] } = req.body;

    if (!Array.isArray(member_list) || member_list.length === 0) {
      return this.validationErrorResponse(res, [{
        field: 'member_list',
        message: '成员列表不能为空'
      }]);
    }

    const group = await Group.findByPk(id);
    if (!group) {
      return this.notFoundResponse(res, '群组不存在');
    }

    try {
      // 获取要移除的联系人
      const contacts = await Contact.findAll({
        where: { wework_user_id: member_list }
      });

      if (contacts.length === 0) {
        return this.errorResponse(res, '未找到有效的联系人', 400);
      }

      // 移除成员
      await group.removeMembers(contacts);

      // 更新群组成员数量
      const newMemberCount = await group.countMembers();
      await group.update({ member_count: newMemberCount });

      this.logAction('REMOVE_GROUP_MEMBERS', {
        group_id: id,
        removed_members: member_list
      }, req);

      return this.successResponse(res, {
        removed_count: contacts.length,
        total_members: newMemberCount
      }, '移除群成员成功');
    } catch (error) {
      console.error('移除群成员失败:', error);
      return this.errorResponse(res, '移除群成员失败', 500, error.message);
    }
  });

  /**
   * 更新成员角色
   */
  updateMemberRole = this.asyncHandler(async (req, res) => {
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!['member', 'admin', 'owner'].includes(role)) {
      return this.validationErrorResponse(res, [{
        field: 'role',
        message: '角色必须是 member、admin 或 owner'
      }]);
    }

    const group = await Group.findByPk(id);
    if (!group) {
      return this.notFoundResponse(res, '群组不存在');
    }

    const contact = await Contact.findByPk(memberId);
    if (!contact) {
      return this.notFoundResponse(res, '成员不存在');
    }

    try {
      // 检查成员是否在群组中
      const membership = await group.hasMembers([contact]);
      if (!membership) {
        return this.errorResponse(res, '该用户不是群组成员', 400);
      }

      // 更新成员角色
      await group.updateMemberRole(contact.id, role);

      this.logAction('UPDATE_MEMBER_ROLE', {
        group_id: id,
        member_id: memberId,
        new_role: role
      }, req);

      return this.successResponse(res, null, '更新成员角色成功');
    } catch (error) {
      console.error('更新成员角色失败:', error);
      return this.errorResponse(res, '更新成员角色失败', 500, error.message);
    }
  });

  /**
   * 获取群组消息
   */
  getGroupMessages = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit, offset } = this.getPaginationParams(req.query);
    const order = this.getSortParams(req.query, ['created_at'], 'created_at', 'DESC');

    const group = await Group.findByPk(id);
    if (!group) {
      return this.notFoundResponse(res, '群组不存在');
    }

    const where = {
      group_id: id,
      is_recalled: false
    };

    // 消息类型筛选
    if (req.query.msg_type) {
      where.msg_type = req.query.msg_type;
    }

    // 发送者筛选
    if (req.query.sender_id) {
      where.sender_id = req.query.sender_id;
    }

    // 日期范围筛选
    const dateCondition = this.getDateRangeParams(req.query, 'created_at');
    Object.assign(where, dateCondition);

    const { count, rows } = await Message.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: [{
        model: Bot,
        as: 'bot',
        attributes: ['id', 'name', 'avatar']
      }]
    });

    const pagination = {
      page,
      limit,
      total: count
    };

    return this.paginatedResponse(res, rows, pagination, '获取群组消息成功');
  });

  /**
   * 发送群组消息
   */
  sendMessage = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      content,
      msg_type = 'text',
      sender_id,
      mentioned_list = [],
      bot_id
    } = req.body;

    // 验证必需字段
    const requiredErrors = this.validateRequired(req.body, ['content']);
    if (requiredErrors.length > 0) {
      return this.validationErrorResponse(res, requiredErrors);
    }

    const group = await Group.findByPk(id);
    if (!group) {
      return this.notFoundResponse(res, '群组不存在');
    }

    try {
      // 创建消息记录
      const message = await Message.create({
        group_id: id,
        bot_id,
        sender_id,
        chat_id: group.wework_chat_id,
        chat_type: 'group',
        msg_type,
        content,
        mentioned_list,
        is_from_bot: !!bot_id,
        send_status: 'pending',
        send_time: new Date()
      });

      // 如果指定了机器人，通过机器人发送消息
      if (bot_id) {
        const bot = await Bot.findByPk(bot_id);
        if (bot && bot.is_enabled && bot.status === 'active') {
          try {
            await bot.sendText(content, mentioned_list);
            await message.update({
              send_status: 'sent',
              delivered_time: new Date()
            });
          } catch (error) {
            await message.update({
              send_status: 'failed',
              error_message: error.message
            });
          }
        }
      }

      this.logAction('SEND_GROUP_MESSAGE', {
        group_id: id,
        message_id: message.id,
        msg_type,
        bot_id
      }, req);

      return this.successResponse(res, message, '发送消息成功', 201);
    } catch (error) {
      console.error('发送群组消息失败:', error);
      return this.errorResponse(res, '发送消息失败', 500, error.message);
    }
  });

  /**
   * 同步企业微信群组
   */
  syncFromWework = this.asyncHandler(async (req, res) => {
    try {
      const accessToken = await this.getWeworkAccessToken();
      if (!accessToken) {
        return this.errorResponse(res, '获取企业微信访问令牌失败', 500);
      }

      // 获取群聊列表
      const chatList = await this.getWeworkChatList(accessToken);
      
      const syncResults = {
        created: 0,
        updated: 0,
        failed: 0
      };

      for (const chatData of chatList) {
        try {
          const [group, created] = await Group.findOrCreate({
            where: { wework_chat_id: chatData.chatid },
            defaults: {
              name: chatData.name,
              wework_chat_id: chatData.chatid,
              group_type: chatData.type === 'single' ? 'external' : 'internal',
              owner_id: chatData.owner,
              member_list: chatData.userlist || [],
              member_count: (chatData.userlist || []).length,
              status: 'active',
              is_enabled: true
            }
          });

          if (created) {
            syncResults.created++;
          } else {
            await group.update({
              name: chatData.name,
              owner_id: chatData.owner,
              member_list: chatData.userlist || [],
              member_count: (chatData.userlist || []).length
            });
            syncResults.updated++;
          }
        } catch (error) {
          console.error('同步群组失败:', error);
          syncResults.failed++;
        }
      }

      this.logAction('SYNC_GROUPS_FROM_WEWORK', syncResults, req);

      return this.successResponse(res, syncResults, '同步企业微信群组成功');
    } catch (error) {
      console.error('同步企业微信群组失败:', error);
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
   * 获取企业微信群聊列表
   */
  async getWeworkChatList(accessToken) {
    try {
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/appchat/list', {
        params: {
          access_token: accessToken
        }
      });

      if (response.data.errcode === 0) {
        return response.data.chatlist || [];
      } else {
        console.error('获取群聊列表失败:', response.data);
        return [];
      }
    } catch (error) {
      console.error('获取群聊列表异常:', error);
      return [];
    }
  }
}

module.exports = new GroupController();