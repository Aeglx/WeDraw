const productService = require('../../src/services/productService');
const { Product, Category } = require('../../src/models');

describe('ProductService', () => {
  let testCategory;

  beforeEach(async () => {
    testCategory = await Category.create({
      name: '测试分类',
      description: '测试分类描述',
      status: 'active'
    });
  });

  describe('getProducts', () => {
    beforeEach(async () => {
      // 创建测试商品
      await Product.bulkCreate([
        {
          name: '商品1',
          description: '商品1描述',
          price: 100,
          points_price: 1000,
          stock: 50,
          category_id: testCategory.id,
          status: 'active'
        },
        {
          name: '商品2',
          description: '商品2描述',
          price: 200,
          points_price: 2000,
          stock: 30,
          category_id: testCategory.id,
          status: 'active'
        },
        {
          name: '下架商品',
          description: '下架商品描述',
          price: 150,
          points_price: 1500,
          stock: 20,
          category_id: testCategory.id,
          status: 'inactive'
        }
      ]);
    });

    it('should return active products with pagination', async () => {
      const result = await productService.getProducts({ page: 1, limit: 10 });

      expect(result.products).toHaveLength(2); // 只返回active状态的商品
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter products by category', async () => {
      const result = await productService.getProducts({
        category_id: testCategory.id,
        page: 1,
        limit: 10
      });

      expect(result.products).toHaveLength(2);
      result.products.forEach(product => {
        expect(product.category_id).toBe(testCategory.id);
      });
    });

    it('should filter products by price range', async () => {
      const result = await productService.getProducts({
        min_price: 150,
        max_price: 250,
        page: 1,
        limit: 10
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('商品2');
    });

    it('should search products by name', async () => {
      const result = await productService.getProducts({
        search: '商品1',
        page: 1,
        limit: 10
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('商品1');
    });
  });

  describe('getProductById', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await createTestProduct();
    });

    it('should return product by id', async () => {
      const product = await productService.getProductById(testProduct.id);

      expect(product).toBeDefined();
      expect(product.id).toBe(testProduct.id);
      expect(product.name).toBe(testProduct.name);
      expect(product.Category).toBeDefined();
    });

    it('should return null for non-existent product', async () => {
      const product = await productService.getProductById(99999);
      expect(product).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create a new product successfully', async () => {
      const productData = {
        name: '新商品',
        description: '新商品描述',
        price: 300,
        points_price: 3000,
        stock: 100,
        category_id: testCategory.id,
        images: ['image1.jpg', 'image2.jpg']
      };

      const product = await productService.createProduct(productData);

      expect(product).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.price).toBe(productData.price);
      expect(product.points_price).toBe(productData.points_price);
      expect(product.stock).toBe(productData.stock);
      expect(product.category_id).toBe(productData.category_id);
      expect(product.sku).toBeDefined();
      expect(product.status).toBe('active');
    });

    it('should throw error for invalid category', async () => {
      const productData = {
        name: '新商品',
        description: '新商品描述',
        price: 300,
        points_price: 3000,
        stock: 100,
        category_id: 99999
      };

      await expect(productService.createProduct(productData)).rejects.toThrow();
    });
  });

  describe('updateProduct', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await createTestProduct();
    });

    it('should update product successfully', async () => {
      const updateData = {
        name: '更新后的商品',
        price: 150,
        stock: 80
      };

      const updatedProduct = await productService.updateProduct(testProduct.id, updateData);

      expect(updatedProduct.name).toBe(updateData.name);
      expect(updatedProduct.price).toBe(updateData.price);
      expect(updatedProduct.stock).toBe(updateData.stock);
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        productService.updateProduct(99999, { name: '不存在的商品' })
      ).rejects.toThrow('商品不存在');
    });
  });

  describe('deleteProduct', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await createTestProduct();
    });

    it('should soft delete product', async () => {
      await productService.deleteProduct(testProduct.id);

      const product = await Product.findByPk(testProduct.id);
      expect(product.status).toBe('deleted');
    });

    it('should throw error for non-existent product', async () => {
      await expect(productService.deleteProduct(99999)).rejects.toThrow('商品不存在');
    });
  });

  describe('checkStock', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await createTestProduct();
    });

    it('should return true for sufficient stock', async () => {
      const hasStock = await productService.checkStock(testProduct.id, 10);
      expect(hasStock).toBe(true);
    });

    it('should return false for insufficient stock', async () => {
      const hasStock = await productService.checkStock(testProduct.id, 100);
      expect(hasStock).toBe(false);
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        productService.checkStock(99999, 10)
      ).rejects.toThrow('商品不存在');
    });
  });

  describe('reduceStock', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await createTestProduct();
    });

    it('should reduce stock successfully', async () => {
      const originalStock = testProduct.stock;
      const reduceAmount = 10;

      await productService.reduceStock(testProduct.id, reduceAmount);

      const updatedProduct = await Product.findByPk(testProduct.id);
      expect(updatedProduct.stock).toBe(originalStock - reduceAmount);
    });

    it('should throw error for insufficient stock', async () => {
      await expect(
        productService.reduceStock(testProduct.id, 100)
      ).rejects.toThrow('库存不足');
    });
  });

  describe('restoreStock', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await createTestProduct();
      // 先减少库存
      await productService.reduceStock(testProduct.id, 10);
    });

    it('should restore stock successfully', async () => {
      const currentStock = (await Product.findByPk(testProduct.id)).stock;
      const restoreAmount = 5;

      await productService.restoreStock(testProduct.id, restoreAmount);

      const updatedProduct = await Product.findByPk(testProduct.id);
      expect(updatedProduct.stock).toBe(currentStock + restoreAmount);
    });
  });

  describe('getHotProducts', () => {
    beforeEach(async () => {
      // 创建热门商品（高销量）
      await Product.bulkCreate([
        {
          name: '热门商品1',
          description: '热门商品1描述',
          price: 100,
          points_price: 1000,
          stock: 50,
          category_id: testCategory.id,
          sales_count: 100,
          status: 'active'
        },
        {
          name: '热门商品2',
          description: '热门商品2描述',
          price: 200,
          points_price: 2000,
          stock: 30,
          category_id: testCategory.id,
          sales_count: 80,
          status: 'active'
        },
        {
          name: '普通商品',
          description: '普通商品描述',
          price: 150,
          points_price: 1500,
          stock: 20,
          category_id: testCategory.id,
          sales_count: 10,
          status: 'active'
        }
      ]);
    });

    it('should return hot products ordered by sales count', async () => {
      const hotProducts = await productService.getHotProducts(2);

      expect(hotProducts).toHaveLength(2);
      expect(hotProducts[0].name).toBe('热门商品1');
      expect(hotProducts[1].name).toBe('热门商品2');
      expect(hotProducts[0].sales_count).toBeGreaterThan(hotProducts[1].sales_count);
    });
  });
});