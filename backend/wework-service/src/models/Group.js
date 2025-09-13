/**
 * 企业微信群组模型
 */

module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '群组ID'
    },
    wework_chat_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '企业微信群聊ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '群组名称'
    },
    owner: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '群主UserID'
    },
    type: {
      type: DataTypes.ENUM('single', 'group'),
      defaultValue: 'group',
      comment: '聊天类型：single-单聊，group-群聊'
    },
    chat_type: {
      type: DataTypes.ENUM('internal', 'external'),
      defaultValue: 'internal',
      comment: '群聊类型：internal-内部群，external-外部群'
    },
    member_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '群成员数量'
    },
    max_members: {
      type: DataTypes.INTEGER,
      defaultValue: 500,
      comment: '最大成员数量'
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '群头像URL'
    },
    notice: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '群公告'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '群描述'
    },
    admin_list: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '群管理员列表'
    },
    member_list: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '群成员列表'
    },
    join_scene: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '入群方式'
    },
    create_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '群创建时间'
    },
    last_msg_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后消息时间'
    },
    last_msg_content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '最后消息内容'
    },
    is_muted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否全员禁言'
    },
    mute_all: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否开启全员禁言'
    },
    allow_add_member: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否允许成员邀请'
    },
    allow_change_name: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否允许成员修改群名称'
    },
    only_admin_add: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否仅群主和管理员可邀请'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '群标签'
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '群设置'
    },
    last_sync_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后同步时间'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已归档'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    tableName: 'groups',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['wework_chat_id']
      },
      {
        fields: ['name']
      },
      {
        fields: ['owner']
      },
      {
        fields: ['type']
      },
      {
        fields: ['chat_type']
      },
      {
        fields: ['member_count']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_archived']
      },
      {
        fields: ['last_sync_at']
      },
      {
        fields: ['created_at']
      }
    ],
    comment: '企业微信群组表'
  });

  Group.associate = function(models) {
    // 群组包含多个联系人
    Group.belongsToMany(models.Contact, {
      through: 'group_members',
      foreignKey: 'group_id',
      otherKey: 'contact_id',
      as: 'members'
    });
    
    // 群组的消息
    Group.hasMany(models.Message, {
      foreignKey: 'group_id',
      as: 'messages'
    });
    
    // 群组的机器人
    Group.hasMany(models.Bot, {
      foreignKey: 'group_id',
      as: 'bots'
    });
  };

  // 实例方法：添加成员
  Group.prototype.addMember = async function(contactId, role = 'member') {
    const { GroupMember } = sequelize.models;
    
    return await GroupMember.create({
      group_id: this.id,
      contact_id: contactId,
      role: role,
      joined_at: new Date()
    });
  };

  // 实例方法：移除成员
  Group.prototype.removeMember = async function(contactId) {
    const { GroupMember } = sequelize.models;
    
    return await GroupMember.destroy({
      where: {
        group_id: this.id,
        contact_id: contactId
      }
    });
  };

  // 实例方法：更新成员角色
  Group.prototype.updateMemberRole = async function(contactId, role) {
    const { GroupMember } = sequelize.models;
    
    return await GroupMember.update(
      { role: role },
      {
        where: {
          group_id: this.id,
          contact_id: contactId
        }
      }
    );
  };

  // 实例方法：获取活跃成员
  Group.prototype.getActiveMembers = async function() {
    const { Contact } = sequelize.models;
    
    return await this.getMembers({
      where: {
        is_active: true
      },
      through: {
        where: {
          is_active: true
        }
      }
    });
  };

  // 实例方法：检查是否为群主
  Group.prototype.isOwner = function(userId) {
    return this.owner === userId;
  };

  // 实例方法：检查是否为管理员
  Group.prototype.isAdmin = function(userId) {
    return this.admin_list && this.admin_list.includes(userId);
  };

  // 实例方法：检查是否为成员
  Group.prototype.isMember = function(userId) {
    return this.member_list && this.member_list.includes(userId);
  };

  // 类方法：获取用户的群组
  Group.getUserGroups = async function(userId) {
    return await Group.findAll({
      include: [{
        model: sequelize.models.Contact,
        as: 'members',
        where: {
          wework_user_id: userId
        },
        through: {
          where: {
            is_active: true
          }
        }
      }],
      where: {
        is_active: true
      }
    });
  };

  return Group;
};