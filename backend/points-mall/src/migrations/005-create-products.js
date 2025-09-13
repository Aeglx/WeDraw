'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
      // 基本信息
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      short_description: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      
      // 分类信息
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      brand: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      
      // 价格信息
      points_price: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      
      cash_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      
      original_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      
      // 库存信息
      stock_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      reserved_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      sold_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      // 商品属性
      type: {
        type: Sequelize.ENUM('physical', 'virtual', 'service', 'coupon'),
        defaultValue: 'physical'
      },
      
      weight: {
        type: Sequelize.DECIMAL(8, 3),
        allowNull: true
      },
      
      dimensions: {
        type: Sequelize.JSON,
        defaultValue: '{}'
      },
      
      // 图片信息
      main_image: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      images: {
        type: Sequelize.JSON,
        defaultValue: '[]'
      },
      
      // 状态信息
      status: {
        type: Sequelize.ENUM('draft', 'active', 'inactive', 'out_of_stock', 'discontinued'),
        defaultValue: 'draft'
      },
      
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      is_limited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      // 限制信息
      min_purchase_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      
      max_purchase_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      
      daily_limit: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      
      user_limit: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      
      // 会员限制
      member_level_required: {
        type: Sequelize.ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond'),
        allowNull: true
      },
      
      member_discount: {
        type: Sequelize.JSON,
        defaultValue: '{}'
      },
      
      // 时间限制
      available_from: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      available_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // SEO信息
      slug: {
        type: Sequelize.STRING(200),
        allowNull: true,
        unique: true
      },
      
      meta_title: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      
      meta_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      meta_keywords: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // 统计信息
      view_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      favorite_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.00
      },
      
      review_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      // 排序权重
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      // 扩展信息
      attributes: {
        type: Sequelize.JSON,
        defaultValue: '{}'
      },
      
      specifications: {
        type: Sequelize.JSON,
        defaultValue: '{}'
      },
      
      tags: {
        type: Sequelize.JSON,
        defaultValue: '[]'
      },
      
      // 供应商信息
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      
      supplier_sku: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      
      // 时间戳
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
    
    // 创建索引
    await queryInterface.addIndex('products', ['name']);
    await queryInterface.addIndex('products', ['category_id']);
    await queryInterface.addIndex('products', ['status']);
    await queryInterface.addIndex('products', ['type']);
    await queryInterface.addIndex('products', ['points_price']);
    await queryInterface.addIndex('products', ['is_featured']);
    await queryInterface.addIndex('products', ['is_limited']);
    await queryInterface.addIndex('products', ['member_level_required']);
    await queryInterface.addIndex('products', ['available_from', 'available_until']);
    await queryInterface.addIndex('products', ['created_at']);
    await queryInterface.addIndex('products', ['sort_order']);
    await queryInterface.addIndex('products', ['rating']);
    await queryInterface.addIndex('products', ['sold_quantity']);
    await queryInterface.addIndex('products', ['slug'], { 
      unique: true,
      where: { slug: { [Sequelize.Op.ne]: null } }
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('products');
  }
};