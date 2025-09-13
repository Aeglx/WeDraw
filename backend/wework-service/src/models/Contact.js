/**
 * 企业微信联系人模型
 */

module.exports = (sequelize, DataTypes) => {
  const Contact = sequelize.define('Contact', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '联系人ID'
    },
    wework_user_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '企业微信用户ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '姓名'
    },
    english_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '英文名'
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '职位'
    },
    gender: {
      type: DataTypes.ENUM('0', '1', '2'),
      defaultValue: '0',
      comment: '性别：0-未定义，1-男，2-女'
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '头像URL'
    },
    thumb_avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '头像缩略图URL'
    },
    telephone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '座机号码'
    },
    alias: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '别名'
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '地址'
    },
    open_userid: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '全局唯一用户ID'
    },
    main_department: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '主部门ID'
    },
    status: {
      type: DataTypes.ENUM('1', '2', '4', '5'),
      defaultValue: '1',
      comment: '激活状态：1-已激活，2-已禁用，4-未激活，5-退出企业'
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '员工个人二维码'
    },
    external_profile: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '成员对外属性'
    },
    external_position: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '对外职务'
    },
    hide_mobile: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否隐藏手机号'
    },
    is_leader_in_dept: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '在所在的部门内是否为部门负责人'
    },
    order: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '部门内的排序值'
    },
    direct_leader: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '直属上级UserID'
    },
    biz_mail: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '企业邮箱'
    },
    to_invite: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否邀请该成员使用企业微信'
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
    tableName: 'contacts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['wework_user_id']
      },
      {
        fields: ['name']
      },
      {
        fields: ['mobile']
      },
      {
        fields: ['email']
      },
      {
        fields: ['status']
      },
      {
        fields: ['main_department']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['last_sync_at']
      },
      {
        fields: ['created_at']
      }
    ],
    comment: '企业微信联系人表'
  });

  Contact.associate = function(models) {
    // 联系人属于多个部门
    Contact.belongsToMany(models.Department, {
      through: 'contact_departments',
      foreignKey: 'contact_id',
      otherKey: 'department_id',
      as: 'departments'
    });
    
    // 联系人属于多个群组
    Contact.belongsToMany(models.Group, {
      through: 'group_members',
      foreignKey: 'contact_id',
      otherKey: 'group_id',
      as: 'groups'
    });
    
    // 联系人发送的消息
    Contact.hasMany(models.Message, {
      foreignKey: 'sender_id',
      as: 'sent_messages'
    });
  };

  return Contact;
};