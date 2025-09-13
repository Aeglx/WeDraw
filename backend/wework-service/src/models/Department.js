/**
 * 企业微信部门模型
 */

module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '部门ID'
    },
    wework_dept_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: '企业微信部门ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '部门名称'
    },
    name_en: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '英文名称'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '父部门ID'
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '在父部门中的次序值'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '部门层级'
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '部门路径，用/分隔'
    },
    leader_ids: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '部门负责人ID列表'
    },
    department_leader: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '部门负责人信息'
    },
    is_root: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为根部门'
    },
    member_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '部门成员数量'
    },
    sub_dept_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '子部门数量'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '部门描述'
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
    tableName: 'departments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['wework_dept_id']
      },
      {
        fields: ['name']
      },
      {
        fields: ['parent_id']
      },
      {
        fields: ['level']
      },
      {
        fields: ['order']
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
    comment: '企业微信部门表'
  });

  Department.associate = function(models) {
    // 部门包含多个联系人
    Department.belongsToMany(models.Contact, {
      through: 'contact_departments',
      foreignKey: 'department_id',
      otherKey: 'contact_id',
      as: 'contacts'
    });
    
    // 自关联：父子部门关系
    Department.hasMany(Department, {
      foreignKey: 'parent_id',
      as: 'children'
    });
    
    Department.belongsTo(Department, {
      foreignKey: 'parent_id',
      as: 'parent'
    });
  };

  // 实例方法：获取部门完整路径
  Department.prototype.getFullPath = async function() {
    if (this.path) {
      return this.path;
    }
    
    const paths = [this.name];
    let current = this;
    
    while (current.parent_id) {
      const parent = await Department.findOne({
        where: { wework_dept_id: current.parent_id }
      });
      
      if (parent) {
        paths.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    
    return paths.join('/');
  };

  // 实例方法：获取所有子部门
  Department.prototype.getAllChildren = async function() {
    const children = await Department.findAll({
      where: { parent_id: this.wework_dept_id },
      include: [{
        model: Department,
        as: 'children'
      }]
    });
    
    let allChildren = [...children];
    
    for (const child of children) {
      const grandChildren = await child.getAllChildren();
      allChildren = allChildren.concat(grandChildren);
    }
    
    return allChildren;
  };

  // 类方法：构建部门树
  Department.buildTree = function(departments, parentId = null) {
    const tree = [];
    
    for (const dept of departments) {
      if (dept.parent_id === parentId) {
        const children = Department.buildTree(departments, dept.wework_dept_id);
        if (children.length > 0) {
          dept.dataValues.children = children;
        }
        tree.push(dept);
      }
    }
    
    return tree;
  };

  return Department;
};