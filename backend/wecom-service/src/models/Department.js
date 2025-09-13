module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: '企业微信部门ID',
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '部门名称',
    },
    name_en: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '英文名称',
    },
    parentid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '父部门ID，根部门为0',
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '在父部门中的次序值',
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '部门层级',
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '部门路径，用逗号分隔的ID序列',
    },
    full_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '部门全名，包含父级部门',
    },
    member_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '部门成员数量',
    },
    sub_department_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '子部门数量',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：1-正常，0-删除',
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
    tableName: 'wecom_departments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['department_id'],
      },
      {
        fields: ['parentid'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['level'],
      },
      {
        fields: ['sync_time'],
      },
    ],
    comment: '企业微信部门表',
  });

  // 关联关系
  Department.associate = function(models) {
    // 部门有多个用户
    Department.belongsToMany(models.User, {
      through: 'wecom_user_departments',
      foreignKey: 'department_id',
      otherKey: 'user_id',
      as: 'users',
    });
    
    // 自关联：父子部门关系
    Department.belongsTo(Department, {
      foreignKey: 'parentid',
      targetKey: 'department_id',
      as: 'parent',
    });
    
    Department.hasMany(Department, {
      foreignKey: 'parentid',
      sourceKey: 'department_id',
      as: 'children',
    });
  };

  // 实例方法
  Department.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // 添加便于前端使用的字段
    values.key = values.department_id;
    values.value = values.department_id;
    values.label = values.name;
    values.title = values.name;
    
    return values;
  };

  // 获取部门树形结构
  Department.prototype.getTree = async function() {
    const children = await Department.findAll({
      where: {
        parentid: this.department_id,
        status: 1,
      },
      order: [['order', 'ASC']],
    });
    
    const childrenTree = await Promise.all(
      children.map(child => child.getTree())
    );
    
    return {
      ...this.toJSON(),
      children: childrenTree,
    };
  };

  // 类方法
  Department.findByDepartmentId = function(departmentId) {
    return this.findOne({
      where: { 
        department_id: departmentId,
        status: 1,
      },
      include: [
        {
          association: 'parent',
          attributes: ['department_id', 'name', 'name_en'],
        },
        {
          association: 'children',
          where: { status: 1 },
          required: false,
          attributes: ['department_id', 'name', 'name_en', 'order'],
          order: [['order', 'ASC']],
        },
      ],
    });
  };

  // 获取部门树形结构
  Department.getTree = function(parentId = 1) {
    return this.findAll({
      where: {
        parentid: parentId,
        status: 1,
      },
      order: [['order', 'ASC']],
    }).then(async (departments) => {
      return Promise.all(
        departments.map(async (dept) => {
          const children = await this.getTree(dept.department_id);
          return {
            ...dept.toJSON(),
            children,
          };
        })
      );
    });
  };

  // 获取扁平化的部门列表
  Department.getFlatList = function(options = {}) {
    const { page = 1, limit = 50, parentId = null, search = null } = options;
    const offset = (page - 1) * limit;
    
    const where = { status: 1 };
    
    if (parentId !== null) {
      where.parentid = parentId;
    }
    
    if (search) {
      where[sequelize.Sequelize.Op.or] = [
        { name: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
        { name_en: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
      ];
    }
    
    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['level', 'ASC'], ['order', 'ASC']],
      include: [
        {
          association: 'parent',
          attributes: ['department_id', 'name'],
        },
      ],
    });
  };

  // 更新部门路径和全名
  Department.updatePaths = async function() {
    const departments = await this.findAll({
      where: { status: 1 },
      order: [['level', 'ASC']],
    });
    
    for (const dept of departments) {
      await dept.updatePath();
    }
  };

  // 更新单个部门的路径和全名
  Department.prototype.updatePath = async function() {
    if (this.parentid === 0 || this.parentid === 1) {
      // 根部门
      this.path = this.department_id.toString();
      this.full_name = this.name;
      this.level = 1;
    } else {
      // 子部门
      const parent = await Department.findOne({
        where: { 
          department_id: this.parentid,
          status: 1,
        },
      });
      
      if (parent) {
        this.path = `${parent.path},${this.department_id}`;
        this.full_name = `${parent.full_name}/${this.name}`;
        this.level = parent.level + 1;
      }
    }
    
    await this.save();
  };

  // 获取统计信息
  Department.getStatistics = function() {
    return Promise.all([
      this.count({ where: { status: 1 } }), // 正常部门数
      this.count({ where: { status: 0 } }), // 已删除部门数
      this.max('level', { where: { status: 1 } }), // 最大层级
      this.count({ where: { parentid: 1, status: 1 } }), // 一级部门数
    ]).then(([active, deleted, maxLevel, rootDepts]) => ({
      active,
      deleted,
      maxLevel: maxLevel || 0,
      rootDepts,
      total: active + deleted,
    }));
  };

  return Department;
};