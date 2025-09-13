module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '分类ID'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '父分类ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '分类名称'
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '分类标识符'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '分类描述'
    },
    icon: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '分类图标URL'
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '分类图片URL'
    },
    level: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '分类层级：1-一级分类，2-二级分类，3-三级分类'
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '分类路径（如：1,2,3）'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    },
    product_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '商品数量'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否推荐分类'
    },
    is_visible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否显示'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-禁用，1-启用'
    },
    seo_title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'SEO标题'
    },
    seo_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'SEO描述'
    },
    seo_keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'SEO关键词'
    },
    extra_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '扩展数据'
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
    tableName: 'categories',
    comment: '商品分类表',
    indexes: [
      {
        name: 'idx_parent_id',
        fields: ['parent_id']
      },
      {
        name: 'idx_slug',
        unique: true,
        fields: ['slug']
      },
      {
        name: 'idx_level',
        fields: ['level']
      },
      {
        name: 'idx_sort_order',
        fields: ['sort_order']
      },
      {
        name: 'idx_status',
        fields: ['status']
      },
      {
        name: 'idx_is_visible',
        fields: ['is_visible']
      },
      {
        name: 'idx_is_featured',
        fields: ['is_featured']
      },
      {
        name: 'idx_product_count',
        fields: ['product_count']
      }
    ],
    hooks: {
      beforeUpdate: (category) => {
        category.updated_at = new Date();
      },
      beforeCreate: async (category) => {
        // 自动生成slug
        if (!category.slug) {
          category.slug = category.name.toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        }
        
        // 设置层级和路径
        if (category.parent_id) {
          const parent = await Category.findByPk(category.parent_id);
          if (parent) {
            category.level = parent.level + 1;
            category.path = parent.path ? `${parent.path},${category.parent_id}` : category.parent_id.toString();
          }
        } else {
          category.level = 1;
          category.path = null;
        }
      },
      beforeUpdate: async (category) => {
        // 更新层级和路径
        if (category.changed('parent_id')) {
          if (category.parent_id) {
            const parent = await Category.findByPk(category.parent_id);
            if (parent) {
              category.level = parent.level + 1;
              category.path = parent.path ? `${parent.path},${category.parent_id}` : category.parent_id.toString();
            }
          } else {
            category.level = 1;
            category.path = null;
          }
        }
      }
    }
  });

  // 实例方法
  Category.prototype.isActive = function() {
    return this.status === 1 && this.is_visible;
  };

  Category.prototype.isRoot = function() {
    return !this.parent_id;
  };

  Category.prototype.hasChildren = async function() {
    const count = await Category.count({
      where: { parent_id: this.id }
    });
    return count > 0;
  };

  Category.prototype.getChildren = function(options = {}) {
    return Category.findAll({
      where: { parent_id: this.id },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      ...options
    });
  };

  Category.prototype.getParent = function() {
    if (!this.parent_id) return null;
    return Category.findByPk(this.parent_id);
  };

  Category.prototype.getAncestors = async function() {
    if (!this.path) return [];
    
    const ancestorIds = this.path.split(',').map(id => parseInt(id));
    return Category.findAll({
      where: {
        id: { [sequelize.Sequelize.Op.in]: ancestorIds }
      },
      order: [['level', 'ASC']]
    });
  };

  Category.prototype.getDescendants = function(options = {}) {
    const pathPattern = this.path ? `${this.path},${this.id}%` : `${this.id}%`;
    
    return Category.findAll({
      where: {
        path: {
          [sequelize.Sequelize.Op.like]: pathPattern
        }
      },
      order: [['level', 'ASC'], ['sort_order', 'ASC']],
      ...options
    });
  };

  Category.prototype.updateProductCount = async function() {
    const count = await sequelize.models.Product.count({
      where: { 
        category_id: this.id,
        status: 1
      }
    });
    
    this.product_count = count;
    await this.save();
    
    return count;
  };

  Category.prototype.getBreadcrumb = async function() {
    const breadcrumb = [];
    
    if (this.path) {
      const ancestors = await this.getAncestors();
      breadcrumb.push(...ancestors.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      })));
    }
    
    breadcrumb.push({
      id: this.id,
      name: this.name,
      slug: this.slug
    });
    
    return breadcrumb;
  };

  // 类方法
  Category.findBySlug = function(slug) {
    return this.findOne({ where: { slug } });
  };

  Category.findActive = function(options = {}) {
    return this.findAll({
      where: {
        status: 1,
        is_visible: true
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      ...options
    });
  };

  Category.findRootCategories = function(options = {}) {
    return this.findAll({
      where: {
        parent_id: null,
        status: 1,
        is_visible: true
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      ...options
    });
  };

  Category.findFeatured = function(options = {}) {
    return this.findAll({
      where: {
        is_featured: true,
        status: 1,
        is_visible: true
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      ...options
    });
  };

  Category.findByLevel = function(level, options = {}) {
    return this.findAll({
      where: {
        level,
        status: 1,
        is_visible: true
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      ...options
    });
  };

  Category.buildTree = async function(parentId = null, options = {}) {
    const categories = await this.findAll({
      where: {
        parent_id: parentId,
        status: 1,
        is_visible: true
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      ...options
    });
    
    const tree = [];
    
    for (const category of categories) {
      const categoryData = category.toJSON();
      categoryData.children = await this.buildTree(category.id, options);
      tree.push(categoryData);
    }
    
    return tree;
  };

  Category.getFullTree = function(options = {}) {
    return this.buildTree(null, options);
  };

  Category.search = function(keyword, options = {}) {
    return this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            name: {
              [sequelize.Sequelize.Op.like]: `%${keyword}%`
            }
          },
          {
            description: {
              [sequelize.Sequelize.Op.like]: `%${keyword}%`
            }
          }
        ],
        status: 1,
        is_visible: true
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      ...options
    });
  };

  Category.updateAllProductCounts = async function() {
    const categories = await this.findAll();
    
    for (const category of categories) {
      await category.updateProductCount();
    }
    
    return categories.length;
  };

  Category.getStatistics = async function() {
    const total = await this.count();
    const active = await this.count({
      where: {
        status: 1,
        is_visible: true
      }
    });
    const featured = await this.count({
      where: {
        is_featured: true,
        status: 1
      }
    });
    
    const levelStats = await this.findAll({
      attributes: [
        'level',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        status: 1,
        is_visible: true
      },
      group: ['level'],
      raw: true
    });
    
    const topCategories = await this.findAll({
      where: {
        status: 1,
        is_visible: true
      },
      order: [['product_count', 'DESC']],
      limit: 10,
      attributes: ['id', 'name', 'product_count']
    });
    
    return {
      total,
      active,
      featured,
      inactive: total - active,
      levels: levelStats.reduce((acc, item) => {
        acc[`level_${item.level}`] = parseInt(item.count);
        return acc;
      }, {}),
      topCategories: topCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        productCount: cat.product_count
      }))
    };
  };

  return Category;
};