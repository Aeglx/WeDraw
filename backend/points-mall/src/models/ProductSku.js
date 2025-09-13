module.exports = (sequelize, DataTypes) => {
  const ProductSku = sequelize.define('ProductSku', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'SKU ID'
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '商品ID'
    },
    sku_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'SKU编码'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'SKU名称'
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '规格属性（如：{"颜色": "红色", "尺寸": "L"}）'
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
    reserved_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '预留库存（已下单未支付）'
    },
    warning_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      comment: '库存预警数量'
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
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '条形码'
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'SKU图片URL'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否为默认SKU'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-禁用，1-启用'
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
    tableName: 'product_skus',
    comment: '商品SKU表',
    indexes: [
      {
        name: 'idx_product_id',
        fields: ['product_id']
      },
      {
        name: 'idx_sku_code',
        unique: true,
        fields: ['sku_code']
      },
      {
        name: 'idx_barcode',
        fields: ['barcode']
      },
      {
        name: 'idx_stock',
        fields: ['stock']
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
        name: 'idx_is_default',
        fields: ['is_default']
      },
      {
        name: 'idx_status',
        fields: ['status']
      },
      {
        name: 'idx_sort_order',
        fields: ['sort_order']
      }
    ],
    hooks: {
      beforeUpdate: (sku) => {
        sku.updated_at = new Date();
      },
      beforeCreate: async (sku) => {
        // 自动生成SKU编码
        if (!sku.sku_code) {
          sku.sku_code = await ProductSku.generateSkuCode(sku.product_id);
        }
        
        // 如果设置为默认SKU，需要将其他默认SKU取消
        if (sku.is_default) {
          await ProductSku.update(
            { is_default: false },
            { where: { product_id: sku.product_id, is_default: true } }
          );
        }
      },
      beforeUpdate: async (sku) => {
        // 如果设置为默认SKU，需要将其他默认SKU取消
        if (sku.changed('is_default') && sku.is_default) {
          await ProductSku.update(
            { is_default: false },
            { 
              where: { 
                product_id: sku.product_id, 
                is_default: true,
                id: { [sequelize.Sequelize.Op.ne]: sku.id }
              } 
            }
          );
        }
      }
    }
  });

  // 实例方法
  ProductSku.prototype.isActive = function() {
    return this.status === 1;
  };

  ProductSku.prototype.isInStock = function() {
    return this.getAvailableStock() > 0;
  };

  ProductSku.prototype.getAvailableStock = function() {
    return Math.max(0, this.stock - this.reserved_stock);
  };

  ProductSku.prototype.isLowStock = function() {
    return this.stock <= this.warning_stock;
  };

  ProductSku.prototype.canPurchase = function(quantity = 1) {
    if (!this.isActive()) return false;
    if (quantity <= 0) return false;
    return this.getAvailableStock() >= quantity;
  };

  ProductSku.prototype.getSpecificationText = function() {
    if (!this.specifications) return '';
    
    return Object.entries(this.specifications)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  ProductSku.prototype.getDiscountPercentage = function() {
    if (!this.original_price || this.original_price <= this.cash_price) {
      return 0;
    }
    
    return Math.round((1 - this.cash_price / this.original_price) * 100);
  };

  ProductSku.prototype.reserveStock = async function(quantity, transaction = null) {
    if (!this.canPurchase(quantity)) {
      throw new Error('库存不足');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.increment('reserved_stock', { by: quantity, ...options });
    return this.reload(options);
  };

  ProductSku.prototype.releaseStock = async function(quantity, transaction = null) {
    if (this.reserved_stock < quantity) {
      throw new Error('预留库存不足');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.decrement('reserved_stock', { by: quantity, ...options });
    return this.reload(options);
  };

  ProductSku.prototype.confirmSale = async function(quantity, transaction = null) {
    if (this.reserved_stock < quantity) {
      throw new Error('预留库存不足');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.decrement('reserved_stock', { by: quantity, ...options });
    await this.decrement('stock', { by: quantity, ...options });
    await this.increment('sold_count', { by: quantity, ...options });
    
    return this.reload(options);
  };

  ProductSku.prototype.addStock = async function(quantity, transaction = null) {
    if (quantity <= 0) {
      throw new Error('库存数量必须大于0');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.increment('stock', { by: quantity, ...options });
    return this.reload(options);
  };

  ProductSku.prototype.setAsDefault = async function() {
    // 先将同商品的其他默认SKU取消
    await ProductSku.update(
      { is_default: false },
      { where: { product_id: this.product_id, is_default: true } }
    );
    
    // 设置当前SKU为默认
    this.is_default = true;
    await this.save();
    
    return this;
  };

  // 类方法
  ProductSku.generateSkuCode = async function(productId) {
    const product = await sequelize.models.Product.findByPk(productId);
    if (!product) {
      throw new Error('商品不存在');
    }
    
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `SKU${productId}${timestamp}${random}`;
  };

  ProductSku.findByProductId = function(productId, options = {}) {
    return this.findAll({
      where: { 
        product_id: productId,
        status: 1
      },
      order: [['is_default', 'DESC'], ['sort_order', 'ASC'], ['created_at', 'ASC']],
      ...options
    });
  };

  ProductSku.findBySkuCode = function(skuCode) {
    return this.findOne({ where: { sku_code: skuCode } });
  };

  ProductSku.findByBarcode = function(barcode) {
    return this.findOne({ where: { barcode } });
  };

  ProductSku.findDefaultSku = function(productId) {
    return this.findOne({
      where: {
        product_id: productId,
        is_default: true,
        status: 1
      }
    });
  };

  ProductSku.findLowStock = function(options = {}) {
    return this.findAll({
      where: {
        status: 1,
        stock: {
          [sequelize.Sequelize.Op.lte]: sequelize.col('warning_stock')
        }
      },
      order: [['stock', 'ASC']],
      ...options
    });
  };

  ProductSku.findOutOfStock = function(options = {}) {
    return this.findAll({
      where: {
        status: 1,
        stock: 0
      },
      order: [['updated_at', 'DESC']],
      ...options
    });
  };

  ProductSku.findByPriceRange = function(minPrice, maxPrice, options = {}) {
    const where = { status: 1 };
    
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

  ProductSku.findByPointsRange = function(minPoints, maxPoints, options = {}) {
    const where = { status: 1 };
    
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

  ProductSku.createBatch = async function(productId, skus, transaction = null) {
    const options = transaction ? { transaction } : {};
    
    const skuData = await Promise.all(
      skus.map(async (sku, index) => ({
        product_id: productId,
        sku_code: sku.sku_code || await this.generateSkuCode(productId),
        name: sku.name,
        specifications: sku.specifications,
        points_price: sku.points_price || 0,
        cash_price: sku.cash_price || 0,
        original_price: sku.original_price,
        cost_price: sku.cost_price,
        stock: sku.stock || 0,
        warning_stock: sku.warning_stock || 10,
        weight: sku.weight,
        dimensions: sku.dimensions,
        barcode: sku.barcode,
        image: sku.image,
        sort_order: sku.sort_order || index,
        is_default: sku.is_default || index === 0,
        status: 1
      }))
    );
    
    return this.bulkCreate(skuData, options);
  };

  ProductSku.updateStock = async function(skuId, quantity, transaction = null) {
    const options = transaction ? { transaction } : {};
    
    const sku = await this.findByPk(skuId, options);
    if (!sku) {
      throw new Error('SKU不存在');
    }
    
    await sku.update({ stock: quantity }, options);
    return sku;
  };

  ProductSku.batchUpdateStock = async function(stockUpdates, transaction = null) {
    const options = transaction ? { transaction } : {};
    
    const updatePromises = stockUpdates.map(({ id, stock }) => 
      this.update(
        { stock },
        { 
          where: { id },
          ...options
        }
      )
    );
    
    await Promise.all(updatePromises);
    return true;
  };

  ProductSku.getProductSkuStats = async function(productId) {
    const stats = await this.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSkus'],
        [sequelize.fn('SUM', sequelize.col('stock')), 'totalStock'],
        [sequelize.fn('SUM', sequelize.col('sold_count')), 'totalSold'],
        [sequelize.fn('SUM', sequelize.col('reserved_stock')), 'totalReserved'],
        [sequelize.fn('MIN', sequelize.col('cash_price')), 'minPrice'],
        [sequelize.fn('MAX', sequelize.col('cash_price')), 'maxPrice'],
        [sequelize.fn('AVG', sequelize.col('cash_price')), 'avgPrice']
      ],
      where: {
        product_id: productId,
        status: 1
      },
      raw: true
    });
    
    const lowStockCount = await this.count({
      where: {
        product_id: productId,
        status: 1,
        stock: {
          [sequelize.Sequelize.Op.lte]: sequelize.col('warning_stock')
        }
      }
    });
    
    const outOfStockCount = await this.count({
      where: {
        product_id: productId,
        status: 1,
        stock: 0
      }
    });
    
    return {
      totalSkus: parseInt(stats?.totalSkus || 0),
      totalStock: parseInt(stats?.totalStock || 0),
      totalSold: parseInt(stats?.totalSold || 0),
      totalReserved: parseInt(stats?.totalReserved || 0),
      availableStock: parseInt(stats?.totalStock || 0) - parseInt(stats?.totalReserved || 0),
      lowStockCount,
      outOfStockCount,
      price: {
        min: parseFloat(stats?.minPrice || 0),
        max: parseFloat(stats?.maxPrice || 0),
        avg: parseFloat(stats?.avgPrice || 0)
      }
    };
  };

  ProductSku.getSystemStats = async function() {
    const total = await this.count();
    const active = await this.count({ where: { status: 1 } });
    const lowStock = await this.count({
      where: {
        status: 1,
        stock: {
          [sequelize.Sequelize.Op.lte]: sequelize.col('warning_stock')
        }
      }
    });
    const outOfStock = await this.count({
      where: {
        status: 1,
        stock: 0
      }
    });
    
    const stockStats = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('stock')), 'totalStock'],
        [sequelize.fn('SUM', sequelize.col('sold_count')), 'totalSold'],
        [sequelize.fn('SUM', sequelize.col('reserved_stock')), 'totalReserved'],
        [sequelize.fn('AVG', sequelize.col('stock')), 'avgStock']
      ],
      where: { status: 1 },
      raw: true
    });
    
    return {
      total,
      active,
      inactive: total - active,
      lowStock,
      outOfStock,
      stock: {
        total: parseInt(stockStats?.totalStock || 0),
        sold: parseInt(stockStats?.totalSold || 0),
        reserved: parseInt(stockStats?.totalReserved || 0),
        available: parseInt(stockStats?.totalStock || 0) - parseInt(stockStats?.totalReserved || 0),
        average: parseFloat(stockStats?.avgStock || 0)
      }
    };
  };

  return ProductSku;
};