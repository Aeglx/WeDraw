module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '商品ID'
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '分类ID'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '商品名称'
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
      comment: '商品标识符'
    },
    subtitle: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '商品副标题'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '商品描述'
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: '商品详情内容'
    },
    main_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '主图片URL'
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '商品类型：1-实物商品，2-虚拟商品，3-服务商品'
    },
    points_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '积分价格'
    },
    cash_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '现金价格'
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '原价'
    },
    cost_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '成本价'
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '库存数量'
    },
    sold_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '销售数量'
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '浏览次数'
    },
    favorite_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '收藏次数'
    },
    review_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '评价次数'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '平均评分'
    },
    weight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
      comment: '重量（kg）'
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '尺寸信息（长宽高）'
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '品牌'
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '型号'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '标签列表'
    },
    attributes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '商品属性'
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '商品规格'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否推荐商品'
    },
    is_hot: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否热门商品'
    },
    is_new: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否新品'
    },
    is_virtual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否虚拟商品'
    },
    need_shipping: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否需要配送'
    },
    shipping_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '配送费用'
    },
    free_shipping_threshold: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '免邮门槛'
    },
    min_purchase: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '最小购买数量'
    },
    max_purchase: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '最大购买数量'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '商品状态：0-下架，1-上架，2-预售'
    },
    publish_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发布时间'
    },
    sale_start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '销售开始时间'
    },
    sale_end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '销售结束时间'
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
    tableName: 'products',
    comment: '商品表',
    indexes: [
      {
        name: 'idx_category_id',
        fields: ['category_id']
      },
      {
        name: 'idx_slug',
        unique: true,
        fields: ['slug']
      },
      {
        name: 'idx_status',
        fields: ['status']
      },
      {
        name: 'idx_type',
        fields: ['type']
      },
      {
        name: 'idx_points_price',
        fields: ['points_price']
      },
      {
        name: 'idx_cash_price',
        fields: ['cash_price']
      },
      {
        name: 'idx_stock',
        fields: ['stock']
      },
      {
        name: 'idx_sold_count',
        fields: ['sold_count']
      },
      {
        name: 'idx_rating',
        fields: ['rating']
      },
      {
        name: 'idx_is_featured',
        fields: ['is_featured']
      },
      {
        name: 'idx_is_hot',
        fields: ['is_hot']
      },
      {
        name: 'idx_is_new',
        fields: ['is_new']
      },
      {
        name: 'idx_sort_order',
        fields: ['sort_order']
      },
      {
        name: 'idx_publish_time',
        fields: ['publish_time']
      },
      {
        name: 'idx_sale_time',
        fields: ['sale_start_time', 'sale_end_time']
      }
    ],
    hooks: {
      beforeUpdate: (product) => {
        product.updated_at = new Date();
      },
      beforeCreate: async (product) => {
        // 自动生成slug
        if (!product.slug) {
          product.slug = product.name.toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            + '-' + Date.now();
        }
        
        // 设置发布时间
        if (!product.publish_time && product.status === 1) {
          product.publish_time = new Date();
        }
      }
    }
  });

  // 商品类型常量
  const PRODUCT_TYPES = {
    PHYSICAL: 1,  // 实物商品
    VIRTUAL: 2,   // 虚拟商品
    SERVICE: 3    // 服务商品
  };

  // 商品状态常量
  const PRODUCT_STATUS = {
    OFFLINE: 0,   // 下架
    ONLINE: 1,    // 上架
    PRESALE: 2    // 预售
  };

  // 实例方法
  Product.prototype.isOnline = function() {
    return this.status === PRODUCT_STATUS.ONLINE;
  };

  Product.prototype.isInStock = function() {
    return this.stock > 0;
  };

  Product.prototype.isAvailable = function() {
    if (!this.isOnline()) return false;
    
    const now = new Date();
    if (this.sale_start_time && now < this.sale_start_time) return false;
    if (this.sale_end_time && now > this.sale_end_time) return false;
    
    return true;
  };

  Product.prototype.canPurchase = function(quantity = 1) {
    if (!this.isAvailable()) return false;
    if (!this.isInStock()) return false;
    if (quantity < this.min_purchase) return false;
    if (this.max_purchase && quantity > this.max_purchase) return false;
    if (quantity > this.stock) return false;
    
    return true;
  };

  Product.prototype.getDiscountPercentage = function() {
    if (!this.original_price || this.original_price <= this.cash_price) {
      return 0;
    }
    
    return Math.round((1 - this.cash_price / this.original_price) * 100);
  };

  Product.prototype.incrementViewCount = async function() {
    await this.increment('view_count');
    return this.reload();
  };

  Product.prototype.incrementSoldCount = async function(quantity = 1) {
    await this.increment('sold_count', { by: quantity });
    await this.decrement('stock', { by: quantity });
    return this.reload();
  };

  Product.prototype.incrementFavoriteCount = async function() {
    await this.increment('favorite_count');
    return this.reload();
  };

  Product.prototype.decrementFavoriteCount = async function() {
    await this.decrement('favorite_count');
    return this.reload();
  };

  Product.prototype.updateRating = async function(newRating) {
    const currentCount = this.review_count;
    const currentRating = this.rating;
    
    const totalRating = currentRating * currentCount + newRating;
    const newCount = currentCount + 1;
    const avgRating = totalRating / newCount;
    
    this.rating = Math.round(avgRating * 100) / 100;
    this.review_count = newCount;
    
    await this.save();
    return this.rating;
  };

  Product.prototype.getMainImage = function() {
    return this.main_image || '/images/default-product.png';
  };

  Product.prototype.getTags = function() {
    return this.tags || [];
  };

  Product.prototype.hasTag = function(tag) {
    const tags = this.getTags();
    return tags.includes(tag);
  };

  Product.prototype.getShippingFee = function(orderAmount = 0) {
    if (!this.need_shipping) return 0;
    if (this.free_shipping_threshold && orderAmount >= this.free_shipping_threshold) {
      return 0;
    }
    return this.shipping_fee;
  };

  // 类方法
  Product.findBySlug = function(slug) {
    return this.findOne({ where: { slug } });
  };

  Product.findOnline = function(options = {}) {
    return this.findAll({
      where: {
        status: PRODUCT_STATUS.ONLINE
      },
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      ...options
    });
  };

  Product.findByCategory = function(categoryId, options = {}) {
    return this.findAll({
      where: {
        category_id: categoryId,
        status: PRODUCT_STATUS.ONLINE
      },
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      ...options
    });
  };

  Product.findFeatured = function(options = {}) {
    return this.findAll({
      where: {
        is_featured: true,
        status: PRODUCT_STATUS.ONLINE
      },
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      ...options
    });
  };

  Product.findHot = function(options = {}) {
    return this.findAll({
      where: {
        is_hot: true,
        status: PRODUCT_STATUS.ONLINE
      },
      order: [['sold_count', 'DESC'], ['sort_order', 'DESC']],
      ...options
    });
  };

  Product.findNew = function(options = {}) {
    return this.findAll({
      where: {
        is_new: true,
        status: PRODUCT_STATUS.ONLINE
      },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  Product.findByPriceRange = function(minPrice, maxPrice, options = {}) {
    const where = {
      status: PRODUCT_STATUS.ONLINE
    };
    
    if (minPrice !== undefined) {
      where.cash_price = { [sequelize.Sequelize.Op.gte]: minPrice };
    }
    
    if (maxPrice !== undefined) {
      where.cash_price = {
        ...where.cash_price,
        [sequelize.Sequelize.Op.lte]: maxPrice
      };
    }
    
    return this.findAll({
      where,
      order: [['cash_price', 'ASC']],
      ...options
    });
  };

  Product.findByPointsRange = function(minPoints, maxPoints, options = {}) {
    const where = {
      status: PRODUCT_STATUS.ONLINE
    };
    
    if (minPoints !== undefined) {
      where.points_price = { [sequelize.Sequelize.Op.gte]: minPoints };
    }
    
    if (maxPoints !== undefined) {
      where.points_price = {
        ...where.points_price,
        [sequelize.Sequelize.Op.lte]: maxPoints
      };
    }
    
    return this.findAll({
      where,
      order: [['points_price', 'ASC']],
      ...options
    });
  };

  Product.search = function(keyword, options = {}) {
    return this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            name: {
              [sequelize.Sequelize.Op.like]: `%${keyword}%`
            }
          },
          {
            subtitle: {
              [sequelize.Sequelize.Op.like]: `%${keyword}%`
            }
          },
          {
            description: {
              [sequelize.Sequelize.Op.like]: `%${keyword}%`
            }
          },
          {
            brand: {
              [sequelize.Sequelize.Op.like]: `%${keyword}%`
            }
          }
        ],
        status: PRODUCT_STATUS.ONLINE
      },
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      ...options
    });
  };

  Product.getTopSelling = function(limit = 10, options = {}) {
    return this.findAll({
      where: {
        status: PRODUCT_STATUS.ONLINE
      },
      order: [['sold_count', 'DESC']],
      limit,
      ...options
    });
  };

  Product.getTopRated = function(limit = 10, options = {}) {
    return this.findAll({
      where: {
        status: PRODUCT_STATUS.ONLINE,
        review_count: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      order: [['rating', 'DESC'], ['review_count', 'DESC']],
      limit,
      ...options
    });
  };

  Product.getStatistics = async function() {
    const total = await this.count();
    const online = await this.count({ where: { status: PRODUCT_STATUS.ONLINE } });
    const offline = await this.count({ where: { status: PRODUCT_STATUS.OFFLINE } });
    const presale = await this.count({ where: { status: PRODUCT_STATUS.PRESALE } });
    const outOfStock = await this.count({ where: { stock: 0 } });
    
    const typeStats = await this.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });
    
    const priceStats = await this.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('cash_price')), 'avgPrice'],
        [sequelize.fn('MIN', sequelize.col('cash_price')), 'minPrice'],
        [sequelize.fn('MAX', sequelize.col('cash_price')), 'maxPrice'],
        [sequelize.fn('SUM', sequelize.col('sold_count')), 'totalSold'],
        [sequelize.fn('SUM', sequelize.col('stock')), 'totalStock']
      ],
      where: { status: PRODUCT_STATUS.ONLINE },
      raw: true
    });
    
    return {
      total,
      online,
      offline,
      presale,
      outOfStock,
      types: typeStats.reduce((acc, item) => {
        const typeNames = { 1: 'physical', 2: 'virtual', 3: 'service' };
        acc[typeNames[item.type]] = parseInt(item.count);
        return acc;
      }, {}),
      price: {
        average: parseFloat(priceStats?.avgPrice || 0).toFixed(2),
        min: parseFloat(priceStats?.minPrice || 0).toFixed(2),
        max: parseFloat(priceStats?.maxPrice || 0).toFixed(2)
      },
      sales: {
        totalSold: parseInt(priceStats?.totalSold || 0),
        totalStock: parseInt(priceStats?.totalStock || 0)
      }
    };
  };

  // 常量导出
  Product.PRODUCT_TYPES = PRODUCT_TYPES;
  Product.PRODUCT_STATUS = PRODUCT_STATUS;

  return Product;
};