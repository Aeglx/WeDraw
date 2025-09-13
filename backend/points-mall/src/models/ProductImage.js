module.exports = (sequelize, DataTypes) => {
  const ProductImage = sequelize.define('ProductImage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '图片ID'
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '商品ID'
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '图片URL'
    },
    alt_text: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '图片替代文本'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '图片标题'
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '图片类型：1-主图，2-详情图，3-缩略图'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '图片宽度'
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '图片高度'
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '文件大小（字节）'
    },
    mime_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'MIME类型'
    },
    is_main: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否为主图'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-禁用，1-启用'
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
    tableName: 'product_images',
    comment: '商品图片表',
    indexes: [
      {
        name: 'idx_product_id',
        fields: ['product_id']
      },
      {
        name: 'idx_type',
        fields: ['type']
      },
      {
        name: 'idx_sort_order',
        fields: ['sort_order']
      },
      {
        name: 'idx_is_main',
        fields: ['is_main']
      },
      {
        name: 'idx_status',
        fields: ['status']
      }
    ],
    hooks: {
      beforeUpdate: (image) => {
        image.updated_at = new Date();
      },
      beforeCreate: async (image) => {
        // 如果设置为主图，需要将其他主图取消
        if (image.is_main) {
          await ProductImage.update(
            { is_main: false },
            { where: { product_id: image.product_id, is_main: true } }
          );
        }
      },
      beforeUpdate: async (image) => {
        // 如果设置为主图，需要将其他主图取消
        if (image.changed('is_main') && image.is_main) {
          await ProductImage.update(
            { is_main: false },
            { 
              where: { 
                product_id: image.product_id, 
                is_main: true,
                id: { [sequelize.Sequelize.Op.ne]: image.id }
              } 
            }
          );
        }
      }
    }
  });

  // 图片类型常量
  const IMAGE_TYPES = {
    MAIN: 1,      // 主图
    DETAIL: 2,    // 详情图
    THUMBNAIL: 3  // 缩略图
  };

  // 实例方法
  ProductImage.prototype.isActive = function() {
    return this.status === 1;
  };

  ProductImage.prototype.isMainImage = function() {
    return this.is_main;
  };

  ProductImage.prototype.getImageInfo = function() {
    return {
      id: this.id,
      url: this.url,
      alt: this.alt_text,
      title: this.title,
      width: this.width,
      height: this.height,
      size: this.file_size,
      type: this.type,
      isMain: this.is_main
    };
  };

  ProductImage.prototype.getThumbnailUrl = function(width = 200, height = 200) {
    // 这里可以根据实际的图片处理服务来生成缩略图URL
    // 例如使用阿里云OSS、腾讯云COS等的图片处理功能
    return `${this.url}?x-oss-process=image/resize,w_${width},h_${height},m_fill`;
  };

  ProductImage.prototype.setAsMain = async function() {
    // 先将同商品的其他主图取消
    await ProductImage.update(
      { is_main: false },
      { where: { product_id: this.product_id, is_main: true } }
    );
    
    // 设置当前图片为主图
    this.is_main = true;
    await this.save();
    
    return this;
  };

  // 类方法
  ProductImage.findByProductId = function(productId, options = {}) {
    return this.findAll({
      where: { 
        product_id: productId,
        status: 1
      },
      order: [['is_main', 'DESC'], ['sort_order', 'ASC'], ['created_at', 'ASC']],
      ...options
    });
  };

  ProductImage.findMainImage = function(productId) {
    return this.findOne({
      where: {
        product_id: productId,
        is_main: true,
        status: 1
      }
    });
  };

  ProductImage.findByType = function(productId, type, options = {}) {
    return this.findAll({
      where: {
        product_id: productId,
        type,
        status: 1
      },
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
      ...options
    });
  };

  ProductImage.createBatch = async function(productId, images, transaction = null) {
    const options = transaction ? { transaction } : {};
    
    const imageData = images.map((image, index) => ({
      product_id: productId,
      url: image.url,
      alt_text: image.alt || '',
      title: image.title || '',
      type: image.type || IMAGE_TYPES.DETAIL,
      sort_order: image.sort_order || index,
      width: image.width,
      height: image.height,
      file_size: image.file_size,
      mime_type: image.mime_type,
      is_main: image.is_main || false,
      status: 1
    }));
    
    return this.bulkCreate(imageData, options);
  };

  ProductImage.updateSortOrder = async function(productId, imageOrders, transaction = null) {
    const options = transaction ? { transaction } : {};
    
    const updatePromises = imageOrders.map(({ id, sort_order }) => 
      this.update(
        { sort_order },
        { 
          where: { 
            id, 
            product_id: productId 
          },
          ...options
        }
      )
    );
    
    await Promise.all(updatePromises);
    return true;
  };

  ProductImage.deleteByProductId = async function(productId, transaction = null) {
    const options = transaction ? { transaction } : {};
    
    return this.destroy({
      where: { product_id: productId },
      ...options
    });
  };

  ProductImage.getProductImageStats = async function(productId) {
    const stats = await this.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('file_size')), 'totalSize']
      ],
      where: {
        product_id: productId,
        status: 1
      },
      group: ['type'],
      raw: true
    });
    
    const result = {
      total: 0,
      totalSize: 0,
      types: {}
    };
    
    const typeNames = {
      [IMAGE_TYPES.MAIN]: 'main',
      [IMAGE_TYPES.DETAIL]: 'detail',
      [IMAGE_TYPES.THUMBNAIL]: 'thumbnail'
    };
    
    stats.forEach(stat => {
      const count = parseInt(stat.count);
      const size = parseInt(stat.totalSize || 0);
      const typeName = typeNames[stat.type] || 'unknown';
      
      result.total += count;
      result.totalSize += size;
      result.types[typeName] = {
        count,
        size
      };
    });
    
    return result;
  };

  ProductImage.getSystemStats = async function() {
    const total = await this.count();
    const active = await this.count({ where: { status: 1 } });
    
    const typeStats = await this.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { status: 1 },
      group: ['type'],
      raw: true
    });
    
    const sizeStats = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('file_size')), 'totalSize'],
        [sequelize.fn('AVG', sequelize.col('file_size')), 'avgSize'],
        [sequelize.fn('MAX', sequelize.col('file_size')), 'maxSize']
      ],
      where: { status: 1 },
      raw: true
    });
    
    return {
      total,
      active,
      inactive: total - active,
      types: typeStats.reduce((acc, item) => {
        const typeNames = { 1: 'main', 2: 'detail', 3: 'thumbnail' };
        acc[typeNames[item.type]] = parseInt(item.count);
        return acc;
      }, {}),
      storage: {
        total: parseInt(sizeStats?.totalSize || 0),
        average: parseInt(sizeStats?.avgSize || 0),
        max: parseInt(sizeStats?.maxSize || 0)
      }
    };
  };

  // 常量导出
  ProductImage.IMAGE_TYPES = IMAGE_TYPES;

  return ProductImage;
};