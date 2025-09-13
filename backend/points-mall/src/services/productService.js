const { Product, Category, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

class ProductService {
  /**
   * 获取商品列表
   */
  async getProducts(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        categoryId,
        keyword,
        minPrice,
        maxPrice,
        status = 'active',
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        featured,
        inStock
      } = options;

      const where = {};

      // 状态筛选
      if (status) {
        where.status = status;
      }

      // 分类筛选
      if (categoryId) {
        where.categoryId = categoryId;
      }

      // 关键词搜索
      if (keyword) {
        where[Op.or] = [
          { name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } },
          { tags: { [Op.like]: `%${keyword}%` } }
        ];
      }

      // 价格范围筛选
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.pointsPrice = {};
        if (minPrice !== undefined) {
          where.pointsPrice[Op.gte] = minPrice;
        }
        if (maxPrice !== undefined) {
          where.pointsPrice[Op.lte] = maxPrice;
        }
      }

      // 精选商品筛选
      if (featured !== undefined) {
        where.featured = featured;
      }

      // 库存筛选
      if (inStock) {
        where.stock = { [Op.gt]: 0 };
      }

      const offset = (page - 1) * limit;

      const { rows: products, count } = await Product.findAndCountAll({
        where,
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset,
        distinct: true
      });

      return {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('获取商品列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取商品详情
   */
  async getProductById(id, includeInactive = false) {
    try {
      const where = { id };
      if (!includeInactive) {
        where.status = 'active';
      }

      const product = await Product.findOne({
        where,
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'description']
        }]
      });

      if (!product) {
        throw new Error('商品不存在');
      }

      // 增加浏览次数
      if (product.status === 'active') {
        await product.increment('viewCount');
      }

      return product;

    } catch (error) {
      logger.error('获取商品详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建商品
   */
  async createProduct(productData, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      // 验证分类是否存在
      if (productData.categoryId) {
        const category = await Category.findByPk(productData.categoryId);
        if (!category) {
          throw new Error('商品分类不存在');
        }
      }

      // 生成商品编码
      if (!productData.sku) {
        productData.sku = await this.generateSKU();
      }

      // 验证SKU唯一性
      const existingProduct = await Product.findOne({
        where: { sku: productData.sku }
      });
      if (existingProduct) {
        throw new Error('商品编码已存在');
      }

      const product = await Product.create({
        ...productData,
        createdBy: adminUserId
      }, { transaction });

      await transaction.commit();

      logger.info(`商品创建成功: ${product.id}`, {
        productId: product.id,
        name: product.name,
        adminUserId
      });

      return await this.getProductById(product.id, true);

    } catch (error) {
      await transaction.rollback();
      logger.error('创建商品失败:', error);
      throw error;
    }
  }

  /**
   * 更新商品
   */
  async updateProduct(id, updateData, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const product = await Product.findByPk(id, { transaction });
      if (!product) {
        throw new Error('商品不存在');
      }

      // 验证分类是否存在
      if (updateData.categoryId && updateData.categoryId !== product.categoryId) {
        const category = await Category.findByPk(updateData.categoryId);
        if (!category) {
          throw new Error('商品分类不存在');
        }
      }

      // 验证SKU唯一性
      if (updateData.sku && updateData.sku !== product.sku) {
        const existingProduct = await Product.findOne({
          where: {
            sku: updateData.sku,
            id: { [Op.ne]: id }
          }
        });
        if (existingProduct) {
          throw new Error('商品编码已存在');
        }
      }

      await product.update({
        ...updateData,
        updatedBy: adminUserId
      }, { transaction });

      await transaction.commit();

      logger.info(`商品更新成功: ${id}`, {
        productId: id,
        adminUserId,
        changes: Object.keys(updateData)
      });

      return await this.getProductById(id, true);

    } catch (error) {
      await transaction.rollback();
      logger.error('更新商品失败:', error);
      throw error;
    }
  }

  /**
   * 删除商品
   */
  async deleteProduct(id, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const product = await Product.findByPk(id, { transaction });
      if (!product) {
        throw new Error('商品不存在');
      }

      // 软删除：更新状态为deleted
      await product.update({
        status: 'deleted',
        updatedBy: adminUserId
      }, { transaction });

      await transaction.commit();

      logger.info(`商品删除成功: ${id}`, {
        productId: id,
        name: product.name,
        adminUserId
      });

      return { success: true, message: '商品删除成功' };

    } catch (error) {
      await transaction.rollback();
      logger.error('删除商品失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新商品状态
   */
  async batchUpdateStatus(productIds, status, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const validStatuses = ['active', 'inactive', 'out_of_stock', 'deleted'];
      if (!validStatuses.includes(status)) {
        throw new Error('无效的商品状态');
      }

      const [updatedCount] = await Product.update({
        status,
        updatedBy: adminUserId
      }, {
        where: {
          id: { [Op.in]: productIds }
        },
        transaction
      });

      await transaction.commit();

      logger.info(`批量更新商品状态成功`, {
        productIds,
        status,
        updatedCount,
        adminUserId
      });

      return {
        success: true,
        updatedCount,
        message: `成功更新${updatedCount}个商品状态`
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('批量更新商品状态失败:', error);
      throw error;
    }
  }

  /**
   * 检查库存
   */
  async checkStock(productId, quantity = 1) {
    try {
      const product = await Product.findByPk(productId);
      if (!product) {
        throw new Error('商品不存在');
      }

      if (product.status !== 'active') {
        throw new Error('商品不可用');
      }

      if (product.stock < quantity) {
        throw new Error('库存不足');
      }

      return {
        available: true,
        stock: product.stock,
        requested: quantity
      };

    } catch (error) {
      logger.error('检查库存失败:', error);
      throw error;
    }
  }

  /**
   * 减少库存
   */
  async reduceStock(productId, quantity, orderId = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const product = await Product.findByPk(productId, {
        transaction,
        lock: true
      });

      if (!product) {
        throw new Error('商品不存在');
      }

      if (product.stock < quantity) {
        throw new Error('库存不足');
      }

      await product.decrement('stock', {
        by: quantity,
        transaction
      });

      // 增加销量
      await product.increment('salesCount', {
        by: quantity,
        transaction
      });

      // 如果库存为0，更新状态
      if (product.stock - quantity === 0) {
        await product.update({
          status: 'out_of_stock'
        }, { transaction });
      }

      await transaction.commit();

      logger.info(`库存减少成功: ${productId} -${quantity}`, {
        productId,
        quantity,
        orderId,
        remainingStock: product.stock - quantity
      });

      return {
        success: true,
        remainingStock: product.stock - quantity
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('减少库存失败:', error);
      throw error;
    }
  }

  /**
   * 恢复库存
   */
  async restoreStock(productId, quantity, orderId = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const product = await Product.findByPk(productId, {
        transaction,
        lock: true
      });

      if (!product) {
        throw new Error('商品不存在');
      }

      await product.increment('stock', {
        by: quantity,
        transaction
      });

      // 减少销量
      await product.decrement('salesCount', {
        by: quantity,
        transaction
      });

      // 如果之前是缺货状态，恢复为可用
      if (product.status === 'out_of_stock') {
        await product.update({
          status: 'active'
        }, { transaction });
      }

      await transaction.commit();

      logger.info(`库存恢复成功: ${productId} +${quantity}`, {
        productId,
        quantity,
        orderId,
        newStock: product.stock + quantity
      });

      return {
        success: true,
        newStock: product.stock + quantity
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('恢复库存失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门商品
   */
  async getPopularProducts(limit = 10, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const products = await Product.findAll({
        where: {
          status: 'active',
          createdAt: { [Op.gte]: startDate }
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }],
        order: [
          ['salesCount', 'DESC'],
          ['viewCount', 'DESC']
        ],
        limit: parseInt(limit)
      });

      return products;

    } catch (error) {
      logger.error('获取热门商品失败:', error);
      throw error;
    }
  }

  /**
   * 获取推荐商品
   */
  async getRecommendedProducts(userId = null, limit = 10) {
    try {
      // 简单的推荐逻辑：精选商品 + 热门商品
      const products = await Product.findAll({
        where: {
          status: 'active',
          [Op.or]: [
            { featured: true },
            { salesCount: { [Op.gt]: 0 } }
          ]
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }],
        order: [
          ['featured', 'DESC'],
          ['salesCount', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit)
      });

      return products;

    } catch (error) {
      logger.error('获取推荐商品失败:', error);
      throw error;
    }
  }

  /**
   * 搜索商品
   */
  async searchProducts(keyword, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        categoryId,
        minPrice,
        maxPrice,
        sortBy = 'relevance'
      } = options;

      const where = {
        status: 'active',
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } },
          { tags: { [Op.like]: `%${keyword}%` } }
        ]
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.pointsPrice = {};
        if (minPrice !== undefined) {
          where.pointsPrice[Op.gte] = minPrice;
        }
        if (maxPrice !== undefined) {
          where.pointsPrice[Op.lte] = maxPrice;
        }
      }

      let order;
      switch (sortBy) {
        case 'price_asc':
          order = [['pointsPrice', 'ASC']];
          break;
        case 'price_desc':
          order = [['pointsPrice', 'DESC']];
          break;
        case 'sales':
          order = [['salesCount', 'DESC']];
          break;
        case 'newest':
          order = [['createdAt', 'DESC']];
          break;
        default:
          // 相关性排序：名称匹配优先
          order = [
            [sequelize.literal(`CASE WHEN name LIKE '%${keyword}%' THEN 1 ELSE 2 END`), 'ASC'],
            ['salesCount', 'DESC']
          ];
      }

      const offset = (page - 1) * limit;

      const { rows: products, count } = await Product.findAndCountAll({
        where,
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }],
        order,
        limit: parseInt(limit),
        offset,
        distinct: true
      });

      return {
        products,
        keyword,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('搜索商品失败:', error);
      throw error;
    }
  }

  /**
   * 获取商品统计信息
   */
  async getProductStats() {
    try {
      const stats = await Product.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('stock')), 'totalStock'],
          [sequelize.fn('SUM', sequelize.col('sales_count')), 'totalSales']
        ],
        group: ['status']
      });

      const categoryStats = await Product.findAll({
        attributes: [
          'categoryId',
          [sequelize.fn('COUNT', sequelize.col('Product.id')), 'count']
        ],
        include: [{
          model: Category,
          as: 'category',
          attributes: ['name']
        }],
        where: { status: 'active' },
        group: ['categoryId', 'category.id']
      });

      return {
        statusStats: stats,
        categoryStats
      };

    } catch (error) {
      logger.error('获取商品统计失败:', error);
      throw error;
    }
  }

  /**
   * 生成商品SKU
   */
  async generateSKU() {
    const prefix = 'PRD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * 上传商品图片
   */
  async uploadProductImage(file, productId = null) {
    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('不支持的图片格式');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('图片文件过大');
      }

      const uploadDir = path.join(config.uploadPath, 'products');
      await fs.mkdir(uploadDir, { recursive: true });

      const fileExt = path.extname(file.originalname);
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, file.buffer);

      const imageUrl = `/uploads/products/${fileName}`;

      logger.info('商品图片上传成功', {
        fileName,
        productId,
        size: file.size
      });

      return {
        url: imageUrl,
        fileName,
        size: file.size
      };

    } catch (error) {
      logger.error('上传商品图片失败:', error);
      throw error;
    }
  }
}

module.exports = new ProductService();