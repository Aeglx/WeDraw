module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userid: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '企业微信用户ID',
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '用户姓名',
    },
    english_name: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '英文名',
    },
    mobile: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '手机号',
    },
    department: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '所属部门ID列表',
    },
    order: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '部门内的排序值',
    },
    position: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: '职务信息',
    },
    gender: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
      comment: '性别：0-未定义，1-男性，2-女性',
    },
    email: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '邮箱',
    },
    biz_mail: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '企业邮箱',
    },
    is_leader_in_dept: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '在所在的部门内是否为部门负责人',
    },
    direct_leader: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '直属上级UserID',
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '头像URL',
    },
    thumb_avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '头像缩略图URL',
    },
    telephone: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '座机',
    },
    alias: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '别名',
    },
    address: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: '地址',
    },
    open_userid: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '全局唯一的userid',
    },
    main_department: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '主部门',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '激活状态：1-已激活，2-已禁用，4-未激活，5-退出企业',
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '员工个人二维码',
    },
    external_profile: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '成员对外属性',
    },
    external_position: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: '对外职务',
    },
    hide_mobile: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否隐藏手机号',
    },
    to_invite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否邀请该成员使用企业微信',
    },
    sync_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后同步时间',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间',
    },
  }, {
    tableName: 'wecom_users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['userid'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['main_department'],
      },
      {
        fields: ['sync_time'],
      },
    ],
    comment: '企业微信用户表',
  });

  // 关联关系
  User.associate = function(models) {
    // 用户属于多个部门
    User.belongsToMany(models.Department, {
      through: 'wecom_user_departments',
      foreignKey: 'user_id',
      otherKey: 'department_id',
      as: 'departments',
    });
    
    // 用户有多个标签
    User.belongsToMany(models.Tag, {
      through: 'wecom_user_tags',
      foreignKey: 'user_id',
      otherKey: 'tag_id',
      as: 'tags',
    });
    
    // 用户发送的消息
    User.hasMany(models.Message, {
      foreignKey: 'sender_id',
      as: 'sentMessages',
    });
    
    // 用户接收的消息
    User.belongsToMany(models.Message, {
      through: 'wecom_message_recipients',
      foreignKey: 'user_id',
      otherKey: 'message_id',
      as: 'receivedMessages',
    });
  };

  // 实例方法
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // 格式化部门信息
    if (values.department && Array.isArray(values.department)) {
      values.departmentIds = values.department;
    }
    
    // 格式化排序信息
    if (values.order && Array.isArray(values.order)) {
      values.departmentOrders = values.order;
    }
    
    // 格式化是否为部门负责人
    if (values.is_leader_in_dept && Array.isArray(values.is_leader_in_dept)) {
      values.isLeaderInDept = values.is_leader_in_dept;
    }
    
    // 格式化直属上级
    if (values.direct_leader && Array.isArray(values.direct_leader)) {
      values.directLeaders = values.direct_leader;
    }
    
    return values;
  };

  // 类方法
  User.findByUserid = function(userid) {
    return this.findOne({
      where: { userid },
      include: [
        {
          association: 'departments',
          attributes: ['id', 'name', 'name_en', 'parentid'],
        },
        {
          association: 'tags',
          attributes: ['id', 'tagname', 'tagid'],
        },
      ],
    });
  };

  User.findByDepartment = function(departmentId, options = {}) {
    const { page = 1, limit = 20, status = null } = options;
    const offset = (page - 1) * limit;
    
    const where = {
      department: {
        [sequelize.Sequelize.Op.contains]: [departmentId],
      },
    };
    
    if (status !== null) {
      where.status = status;
    }
    
    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'departments',
          attributes: ['id', 'name', 'name_en'],
        },
      ],
    });
  };

  User.getStatistics = function() {
    return Promise.all([
      this.count({ where: { status: 1 } }), // 已激活
      this.count({ where: { status: 2 } }), // 已禁用
      this.count({ where: { status: 4 } }), // 未激活
      this.count({ where: { status: 5 } }), // 退出企业
      this.count(), // 总数
    ]).then(([active, disabled, inactive, left, total]) => ({
      active,
      disabled,
      inactive,
      left,
      total,
    }));
  };

  return User;
};