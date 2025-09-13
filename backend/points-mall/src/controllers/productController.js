const { Product, Category, ProductImage, ProductSku } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { validateInput } = require('../utils/validation');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { transaction } = require('../models');

/**
 * 商品控制器
 * 处理商品相关的业务逻辑
 */
class ProductController {
  /**
   * 获取商品列表
   */
  async getProductList(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category_id,
        keyword,
        status = 'published',
        sort = 'created_at',
        order = 'DESC',
        min_points,
        max_points
      } = req.query;
      
      const offset = (page - 1) * limit;
      const where = {};
      
      // 状态筛选
      if (status) {
        where.status = status;
      }
      
      // 分类筛选
      if (category_id) {
        where.category_id = category_id;
      }
      
      // 关键词搜索
      if (keyword) {
        where[Op.or] = [
          { name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } },
          { tags: { [Op.like]: `%${keyword}%` } }
        ];
      }
      
      // 积分价格范围
      if (min_points || max_points) {
        where.points_price = {};
        if (min_points) {
          where.points_price[Op.gte] = parseInt(min_points);
        }
        if (max_points) {
          where.points_price[Op.lte] = parseInt(max_points);
        }
      }
      
      const { count, rows } = await Product.findAndCountAll({
        where,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: ProductImage,
            as: 'images',
            where: { status: 'active' },
            required: false,
            order: [['sort_order', 'ASC']]
          },
          {
            model: ProductSku,
            as: 'skus',
            where: { status: 'active' },
            required: false,
            attributes: ['id', 'sku_code', 'price', 'points_price', 'stock', 'specifications']
          }
        ],
        order: [[sort, order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return successResponse(res, '获取商品列表成功', {
        products: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('获取商品列表失败:', error);
      return errorResponse(res, '获取商品列表失败');
    }
  }
  
  /**
   * 获取商品详情
   */
  async getProductDetail(req, res) {
    try {
      const { productId } = req.params;
      
      const product = await Product.findByPk(productId, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug', 'path']
          },
          {
            model: ProductImage,
            as: 'images',
            where: { status: 'active' },
            required: false,
            order: [['sort_order', 'ASC']]
          },
          {
            model: ProductSku,
            as: 'skus',
            where: { status: 'active' },
            required: false,
            order: [['sort_order', 'ASC']]
          }
        ]
      });
      
      if (!product) {
        return errorResponse(res, '商品不存在', 404);
      }
      
      // 增加浏览次数
      await product.increment('view_count');
      
      return successResponse(res, '获取商品详情成功', product);
    } catch (error) {
      logger.error('获取商品详情失败:', error);
      return errorResponse(res, '获取商品详情失败');
    }
  }
  
  /**
   * 创建商品（管理员）
   */
  async createProduct(req, res) {
    try {
      const {
        category_id,
        name,
        description,
        content,
        price,
        points_price,
        stock,
        images,
        skus,
        tags,
        specifications,
        status = 'draft'
      } = req.body;
      
      // 验证输入
      const validation = validateInput({
        category_id: { value: category_id, type: 'integer', min: 1 },
        name: { value: name, type: 'string', minLength: 1, maxLength: 200 },
        description: { value: description, type: 'string', maxLength: 500, required: false },
        content: { value: content, type: 'string', required: false },
        price: { value: price, type: 'number', min: 0, required: false },
        points_price: { value: points_price, type: 'integer', min: 1 },
        stock: { value: stock, type: 'integer', min: 0, required: false },
        status: { value: status, type: 'enum', enum: ['draft', 'published', 'archived'] }
      });
      
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      
      // 检查分类是否存在
      const category = await Category.findByPk(category_id);
      if (!category) {
        return errorResponse(res, '商品分类不存在', 404);
      }
      
      if (!category.isActive()) {
        return errorResponse(res, '商品分类未激活', 400);
      }
      
      // 创建商品
      const result = await transaction(async (t) => {
        // 创建商品基本信息
        const product = await Product.create({
          category_id,
          name,
          description,
          content,
          price: price || 0,
          points_price,
          stock: stock || 0,
          tags: Array.isArray(tags) ? tags.join(',') : tags,
          specifications: specifications ? JSON.stringify(specifications) : null,
          status,
          created_by: req.user.id
        }, { transaction: t });
        
        // 创建商品图片
        if (images && Array.isArray(images) && images.length > 0) {
          const imageData = images.map((img, index) => ({
            product_id: product.id,
            url: img.url,
            alt: img.alt || product.name,
            type: img.type || 'gallery',
            sort_order: img.sort_order || index + 1,
            is_main: index === 0 || img.is_main
          }));
          
          await ProductImage.bulkCreate(imageData, { transaction: t });
        }
        
        // 创建商品SKU
        if (skus && Array.isArray(skus) && skus.length > 0) {
          const skuData = skus.map((sku, index) => ({
            product_id: product.id,
            sku_code: sku.sku_code || ProductSku.generateSkuCode(product.id, index),
            price: sku.price || product.price,
            points_price: sku.points_price || product.points_price,
            stock: sku.stock || 0,
            specifications: sku.specifications ? JSON.stringify(sku.specifications) : null,
            sort_order: sku.sort_order || index + 1
          }));
          
          await ProductSku.bulkCreate(skuData, { transaction: t });
        }
        
        return product;
      });
      
      logger.info(`管理员 ${req.user.id} 创建商品 ${result.id}`, {
        adminId: req.user.id,
        productId: result.id,
        productName: result.name
      });
      
      return successResponse(res, '创建商品成功', result);
    } catch (error) {
      logger.error('创建商品失败:', error);
      return errorResponse(res, '创建商品失败');
    }
  }
  
  /**
   * 更新商品（管理员）
   */
  async updateProduct(req, res) {
    try {
      const { productId } = req.params;
      const {
        category_id,
        name,
        description,
        content,
        price,
        points_price,
        stock,
        tags,
        specifications,
        status
      } = req.body;
      
      const product = await Product.findByPk(productId);
      if (!product) {
        return errorResponse(res, '商品不存在', 404);
      }
      
      // 验证输入
      const validation = validateInput({
        category_id: { value: category_id, type: 'integer', min: 1, required: false },
        name: { value: name, type: 'string', minLength: 1, maxLength: 200, required: false },
        description: { value: description, type: 'string', maxLength: 500, required: false },
        content: { value: content, type: 'string', required: false },
        price: { value: price, type: 'number', min: 0, required: false },
        points_price: { value: points_price, type: 'integer', min: 1, required: false },
        stock: { value: stock, type: 'integer', min: 0, required: false },
        status: { value: status, type: 'enum', enum: ['draft', 'published', 'archived'], required: false }
      });
      
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      
      // 检查分类是否存在（如果提供了分类ID）
      if (category_id) {
        const category = await Category.findByPk(category_id);
        if (!category) {
          return errorResponse(res, '商品分类不存在', 404);
        }
        if (!category.isActive()) {
          return errorResponse(res, '商品分类未激活', 400);
        }
      }
      
      // 更新商品信息
      const updateData = {};
      if (category_id !== undefined) updateData.category_id = category_id;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (content !== undefined) updateData.content = content;
      if (price !== undefined) updateData.price = price;
      if (points_price !== undefined) updateData.points_price = points_price;
      if (stock !== undefined) updateData.stock = stock;
      if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.join(',') : tags;
      if (specifications !== undefined) updateData.specifications = specifications ? JSON.stringify(specifications) : null;
      if (status !== undefined) updateData.status = status;
      
      updateData.updated_by = req.user.id;
      
      await product.update(updateData);
      
      logger.info(`管理员 ${req.user.id} 更新商品 ${productId}`, {
        adminId: req.user.id,
        productId,
        updateData
      });
      
      return successResponse(res, '更新商品成功', product);
    } catch (error) {
      logger.error('更新商品失败:', error);
      return errorResponse(res, '更新商品失败');
    }
  }
  
  /**
   * 删除商品（管理员）
   */
  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;
      
      const product = await Product.findByPk(productId);
      if (!product) {
        return errorResponse(res, '商品不存在', 404);
      }
      
      // 软删除商品
      await product.update({
        status: 'deleted',
        deleted_at: new Date(),
        updated_by: req.user.id
      });
      
      logger.info(`管理员 ${req.user.id} 删除商品 ${productId}`, {
        adminId: req.user.id,
        productId,
        productName: product.name
      });
      
      return successResponse(res, '删除商品成功');
    } catch (error) {
      logger.error('删除商品失败:', error);
      return errorResponse(res, '删除商品失败');
    }
  }
  
  /**
   * 批量更新商品状态（管理员）
   */
  async batchUpdateStatus(req, res) {
    try {
      const { product_ids, status } = req.body;
      
      // 验证输入
      const validation = validateInput({
        product_ids: { value: product_ids, type: 'array', minLength: 1 },
        status: { value: status, type: 'enum', enum: ['draft', 'published', 'archived', 'deleted'] }
      });
      
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      
      const updateData = {
        status,
        updated_by: req.user.id
      };
      
      if (status === 'deleted') {
        updateData.deleted_at = new Date();
      }
      
      const [affectedCount] = await Product.update(updateData, {
        where: {
          id: { [Op.in]: product_ids }
        }
      });
      
      logger.info(`管理员 ${req.user.id} 批量更新商品状态`, {
        adminId: req.user.id,
        productIds: product_ids,
        status,
        affectedCount
      });
      
      return successResponse(res, `成功更新 ${affectedCount} 个商品状态`);
    } catch (error) {
      logger.error('批量更新商品状态失败:', error);
      return errorResponse(res, '批量更新商品状态失败');
    }
  }
  
  /**
   * 获取热门商品
   */
  async getHotProducts(req, res) {
    try {
      const { limit = 10, days = 7 } = req.query;
      
      const products = await Product.getHotProducts({
        limit: parseInt(limit),
        days: parseInt(days)
      });
      
      return successResponse(res, '获取热门商品成功', products);
    } catch (error) {
      logger.error('获取热门商品失败:', error);
      return errorResponse(res, '获取热门商品失败');
    }
  }
  
  /**
   * 获取推荐商品
   */
  async getRecommendedProducts(req, res) {
    try {
      const { limit = 10, category_id } = req.query;
      
      const products = await Product.getRecommendedProducts({
        limit: parseInt(limit),
        categoryId: category_id
      });
      
      return successResponse(res, '获取推荐商品成功', products);
    } catch (error) {
      logger.error('获取推荐商品失败:', error);
      return errorResponse(res, '获取推荐商品失败');
    }
  }
  
  /**
   * 搜索商品
   */
  async searchProducts(req, res) {
    try {
      const {
        q: keyword,
        page = 1,
        limit = 20,
        category_id,
        min_points,
        max_points,
        sort = 'relevance'
      } = req.query;
      
      if (!keyword) {
        return errorResponse(res, '搜索关键词不能为空', 400);
      }
      
      const results = await Product.searchProducts({
        keyword,
        page: parseInt(page),
        limit: parseInt(limit),
        categoryId: category_id,
        minPoints: min_points,
        maxPoints: max_points,
        sort
      });
      
      return successResponse(res, '搜索商品成功', results);
    } catch (error) {
      logger.error('搜索商品失败:', error);
      return errorResponse(res, '搜索商品失败');
    }
  }
  
  /**
   * 获取商品统计信息（管理员）
   */
  async getProductStats(req, res) {
    try {
      const stats = await Product.getStatistics();
      return successResponse(res, '获取商品统计成功', stats);
    } catch (error) {
      logger.error('获取商品统计失败:', error);
      return errorResponse(res, '获取商品统计失败');
    }
  }
}

module.exports = new ProductController();