const { Category, Product, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const config = require('../config');

class CategoryService {
  /**
   * 获取分类列表
   */
  async getCategories(options = {}) {
    try {
      const {
        page,
        limit,
        parentId,
        level,
        status = 'active',
        includeProducts = false,
        sortBy = 'sortOrder',
        sortOrder = 'ASC'
      } = options;

      const where = {};

      if (status) {
        where.status = status;
      }

      if (parentId !== undefined) {
        where.parentId = parentId;
      }

      if (level !== undefined) {
        where.level = level;
      }

      const include = [];
      if (includeProducts) {
        include.push({
          model: Product,
          as: 'products',
          where: { status: 'active' },
          required: false,
          attributes: ['id', 'name', 'pointsPrice', 'images', 'salesCount']
        });
      }

      // 如果指定了分页参数
      if (page && limit) {
        const offset = (page - 1) * limit;
        const { rows: categories, count } = await Category.findAndCountAll({
          where,
          include,
          order: [[sortBy, sortOrder.toUpperCase()]],
          limit: parseInt(limit),
          offset,
          distinct: true
        });

        return {
          categories,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        };
      }

      // 不分页，返回所有结果
      const categories = await Category.findAll({
        where,
        include,
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      return { categories };

    } catch (error) {
      logger.error('获取分类列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类树结构
   */
  async getCategoryTree(options = {}) {
    try {
      const { status = 'active', includeProducts = false } = options;

      const include = [];
      if (includeProducts) {
        include.push({
          model: Product,
          as: 'products',
          where: { status: 'active' },
          required: false,
          attributes: ['id', 'name', 'pointsPrice', 'images', 'salesCount']
        });
      }

      const categories = await Category.findAll({
        where: { status },
        include,
        order: [['level', 'ASC'], ['sortOrder', 'ASC']]
      });

      // 构建树结构
      const categoryMap = new Map();
      const rootCategories = [];

      // 先创建所有分类的映射
      categories.forEach(category => {
        categoryMap.set(category.id, {
          ...category.toJSON(),
          children: []
        });
      });

      // 构建父子关系
      categories.forEach(category => {
        const categoryData = categoryMap.get(category.id);
        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children.push(categoryData);
          }
        } else {
          rootCategories.push(categoryData);
        }
      });

      return rootCategories;

    } catch (error) {
      logger.error('获取分类树结构失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类详情
   */
  async getCategoryById(id, includeProducts = false) {
    try {
      const include = [];
      if (includeProducts) {
        include.push({
          model: Product,
          as: 'products',
          where: { status: 'active' },
          required: false
        });
      }

      const category = await Category.findByPk(id, { include });
      if (!category) {
        throw new Error('分类不存在');
      }

      return category;

    } catch (error) {
      logger.error('获取分类详情失败:', error);
      throw error;
    }
  }

  /**
   * 根据slug获取分类
   */
  async getCategoryBySlug(slug, includeProducts = false) {
    try {
      const include = [];
      if (includeProducts) {
        include.push({
          model: Product,
          as: 'products',
          where: { status: 'active' },
          required: false
        });
      }

      const category = await Category.findOne({
        where: { slug, status: 'active' },
        include
      });

      if (!category) {
        throw new Error('分类不存在');
      }

      return category;

    } catch (error) {
      logger.error('根据slug获取分类失败:', error);
      throw error;
    }
  }

  /**
   * 创建分类
   */
  async createCategory(categoryData, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      // 验证slug唯一性
      if (categoryData.slug) {
        const existingCategory = await Category.findOne({
          where: { slug: categoryData.slug }
        });
        if (existingCategory) {
          throw new Error('分类标识已存在');
        }
      }

      // 处理父分类
      let level = 1;
      let path = '';
      if (categoryData.parentId) {
        const parentCategory = await Category.findByPk(categoryData.parentId);
        if (!parentCategory) {
          throw new Error('父分类不存在');
        }
        level = parentCategory.level + 1;
        path = parentCategory.path ? `${parentCategory.path},${parentCategory.id}` : parentCategory.id.toString();
      }

      // 获取排序值
      if (!categoryData.sortOrder) {
        const maxSortOrder = await Category.max('sortOrder', {
          where: { parentId: categoryData.parentId || null }
        });
        categoryData.sortOrder = (maxSortOrder || 0) + 1;
      }

      const category = await Category.create({
        ...categoryData,
        level,
        path,
        createdBy: adminUserId
      }, { transaction });

      await transaction.commit();

      logger.info(`分类创建成功: ${category.id}`, {
        categoryId: category.id,
        name: category.name,
        adminUserId
      });

      return category;

    } catch (error) {
      await transaction.rollback();
      logger.error('创建分类失败:', error);
      throw error;
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(id, updateData, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const category = await Category.findByPk(id, { transaction });
      if (!category) {
        throw new Error('分类不存在');
      }

      // 验证slug唯一性
      if (updateData.slug && updateData.slug !== category.slug) {
        const existingCategory = await Category.findOne({
          where: {
            slug: updateData.slug,
            id: { [Op.ne]: id }
          }
        });
        if (existingCategory) {
          throw new Error('分类标识已存在');
        }
      }

      // 处理父分类变更
      if (updateData.parentId !== undefined && updateData.parentId !== category.parentId) {
        // 不能将分类设置为自己的子分类
        if (updateData.parentId) {
          const isDescendant = await this.isDescendant(id, updateData.parentId);
          if (isDescendant) {
            throw new Error('不能将分类设置为自己的子分类');
          }

          const parentCategory = await Category.findByPk(updateData.parentId);
          if (!parentCategory) {
            throw new Error('父分类不存在');
          }

          updateData.level = parentCategory.level + 1;
          updateData.path = parentCategory.path ? `${parentCategory.path},${parentCategory.id}` : parentCategory.id.toString();
        } else {
          updateData.level = 1;
          updateData.path = '';
        }

        // 更新所有子分类的层级和路径
        await this.updateChildrenLevelAndPath(id, transaction);
      }

      await category.update({
        ...updateData,
        updatedBy: adminUserId
      }, { transaction });

      await transaction.commit();

      logger.info(`分类更新成功: ${id}`, {
        categoryId: id,
        adminUserId,
        changes: Object.keys(updateData)
      });

      return await this.getCategoryById(id);

    } catch (error) {
      await transaction.rollback();
      logger.error('更新分类失败:', error);
      throw error;
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(id, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const category = await Category.findByPk(id, { transaction });
      if (!category) {
        throw new Error('分类不存在');
      }

      // 检查是否有子分类
      const childrenCount = await Category.count({
        where: { parentId: id },
        transaction
      });
      if (childrenCount > 0) {
        throw new Error('请先删除子分类');
      }

      // 检查是否有关联商品
      const productCount = await Product.count({
        where: { categoryId: id },
        transaction
      });
      if (productCount > 0) {
        throw new Error('该分类下还有商品，无法删除');
      }

      // 软删除：更新状态为deleted
      await category.update({
        status: 'deleted',
        updatedBy: adminUserId
      }, { transaction });

      await transaction.commit();

      logger.info(`分类删除成功: ${id}`, {
        categoryId: id,
        name: category.name,
        adminUserId
      });

      return { success: true, message: '分类删除成功' };

    } catch (error) {
      await transaction.rollback();
      logger.error('删除分类失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新分类排序
   */
  async updateCategoriesSort(sortData, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      for (const item of sortData) {
        const { id, sortOrder } = item;
        await Category.update({
          sortOrder,
          updatedBy: adminUserId
        }, {
          where: { id },
          transaction
        });
      }

      await transaction.commit();

      logger.info('批量更新分类排序成功', {
        count: sortData.length,
        adminUserId
      });

      return { success: true, message: '排序更新成功' };

    } catch (error) {
      await transaction.rollback();
      logger.error('批量更新分类排序失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类路径
   */
  async getCategoryPath(categoryId) {
    try {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        throw new Error('分类不存在');
      }

      const path = [];
      if (category.path) {
        const pathIds = category.path.split(',').map(id => parseInt(id));
        const pathCategories = await Category.findAll({
          where: { id: { [Op.in]: pathIds } },
          attributes: ['id', 'name', 'slug'],
          order: [['level', 'ASC']]
        });
        path.push(...pathCategories);
      }
      path.push({
        id: category.id,
        name: category.name,
        slug: category.slug
      });

      return path;

    } catch (error) {
      logger.error('获取分类路径失败:', error);
      throw error;
    }
  }

  /**
   * 搜索分类
   */
  async searchCategories(keyword, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'active'
      } = options;

      const where = {
        status,
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ]
      };

      const offset = (page - 1) * limit;

      const { rows: categories, count } = await Category.findAndCountAll({
        where,
        order: [['level', 'ASC'], ['sortOrder', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      return {
        categories,
        keyword,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('搜索分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门分类
   */
  async getPopularCategories(limit = 10) {
    try {
      const categories = await Category.findAll({
        where: { status: 'active' },
        include: [{
          model: Product,
          as: 'products',
          where: { status: 'active' },
          attributes: [],
          required: true
        }],
        attributes: [
          'id',
          'name',
          'slug',
          'icon',
          'image',
          [sequelize.fn('COUNT', sequelize.col('products.id')), 'productCount'],
          [sequelize.fn('SUM', sequelize.col('products.sales_count')), 'totalSales']
        ],
        group: ['Category.id'],
        order: [
          [sequelize.fn('SUM', sequelize.col('products.sales_count')), 'DESC'],
          [sequelize.fn('COUNT', sequelize.col('products.id')), 'DESC']
        ],
        limit: parseInt(limit)
      });

      return categories;

    } catch (error) {
      logger.error('获取热门分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats() {
    try {
      const stats = await Category.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      const levelStats = await Category.findAll({
        where: { status: 'active' },
        attributes: [
          'level',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['level'],
        order: [['level', 'ASC']]
      });

      const productStats = await Category.findAll({
        where: { status: 'active' },
        include: [{
          model: Product,
          as: 'products',
          where: { status: 'active' },
          attributes: [],
          required: false
        }],
        attributes: [
          'id',
          'name',
          [sequelize.fn('COUNT', sequelize.col('products.id')), 'productCount']
        ],
        group: ['Category.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('products.id')), 'DESC']],
        limit: 10
      });

      return {
        statusStats: stats,
        levelStats,
        topCategoriesByProducts: productStats
      };

    } catch (error) {
      logger.error('获取分类统计失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否为子分类
   */
  async isDescendant(ancestorId, descendantId) {
    try {
      const descendant = await Category.findByPk(descendantId);
      if (!descendant || !descendant.path) {
        return false;
      }

      const pathIds = descendant.path.split(',').map(id => parseInt(id));
      return pathIds.includes(parseInt(ancestorId));

    } catch (error) {
      logger.error('检查子分类关系失败:', error);
      return false;
    }
  }

  /**
   * 更新子分类的层级和路径
   */
  async updateChildrenLevelAndPath(parentId, transaction) {
    try {
      const parent = await Category.findByPk(parentId, { transaction });
      if (!parent) return;

      const children = await Category.findAll({
        where: { parentId },
        transaction
      });

      for (const child of children) {
        const newLevel = parent.level + 1;
        const newPath = parent.path ? `${parent.path},${parent.id}` : parent.id.toString();

        await child.update({
          level: newLevel,
          path: newPath
        }, { transaction });

        // 递归更新子分类的子分类
        await this.updateChildrenLevelAndPath(child.id, transaction);
      }

    } catch (error) {
      logger.error('更新子分类层级和路径失败:', error);
      throw error;
    }
  }

  /**
   * 生成分类slug
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * 验证分类数据
   */
  validateCategoryData(data) {
    const { name, slug } = data;

    if (!name || name.trim().length === 0) {
      throw new Error('分类名称不能为空');
    }

    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      throw new Error('分类标识只能包含小写字母、数字和连字符');
    }
  }
}

module.exports = new CategoryService();