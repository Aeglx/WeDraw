'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
      // 基本信息
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // 层级结构
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      
      path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      
      // 显示信息
      icon: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      
      image: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      color: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      
      // 状态信息
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      // 排序
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
      product_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('categories', ['name']);
    await queryInterface.addIndex('categories', ['parent_id']);
    await queryInterface.addIndex('categories', ['level']);
    await queryInterface.addIndex('categories', ['status']);
    await queryInterface.addIndex('categories', ['is_featured']);
    await queryInterface.addIndex('categories', ['sort_order']);
    await queryInterface.addIndex('categories', ['slug'], { 
      unique: true,
      where: { slug: { [Sequelize.Op.ne]: null } }
    });
    await queryInterface.addIndex('categories', ['created_at']);
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('categories');
  }
};