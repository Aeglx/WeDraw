const orderService = require('../../src/services/orderService');
const { Order, OrderItem, Product, User, PointsAccount } = require('../../src/models');

describe('OrderService', () => {
  let testUser, testProduct;

  beforeEach(async () => {
    testUser = await createTestUser();
    testProduct = await createTestProduct();
    
    // 为用户添加积分
    await PointsAccount.update(
      { total_points: 5000, available_points: 5000 },
      { where: { user_id: testUser.id } }
    );
  });

  describe('createOrder', () => {
    it('should create order successfully with sufficient points', async () => {
      const orderData = {
        user_id: testUser.id,
        items: [
          {
            product_id: testProduct.id,
            quantity: 2,
            price: testProduct.price,
            points_price: testProduct.points_price
          }
        ],
        shipping_address: {
          recipient_name: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detail: '某某街道123号'
        },
        payment_method: 'points'
      };

      const order = await orderService.createOrder(orderData);

      expect(order).toBeDefined();
      expect(order.user_id).toBe(testUser.id);
      expect(order.status).toBe('pending');
      expect(order.payment_method).toBe('points');
      expect(order.total_amount).toBe(testProduct.price * 2);
      expect(order.total_points).toBe(testProduct.points_price * 2);
      expect(order.order_number).toBeDefined();

      // 验证订单项
      const orderItems = await OrderItem.findAll({ where: { order_id: order.id } });
      expect(orderItems).toHaveLength(1);
      expect(orderItems[0].product_id).toBe(testProduct.id);
      expect(orderItems[0].quantity).toBe(2);

      // 验证库存减少
      const updatedProduct = await Product.findByPk(testProduct.id);
      expect(updatedProduct.stock).toBe(testProduct.stock - 2);

      // 验证积分扣减
      const pointsAccount = await PointsAccount.findOne({ where: { user_id: testUser.id } });
      expect(pointsAccount.available_points).toBe(5000 - (testProduct.points_price * 2));
    });

    it('should throw error for insufficient points', async () => {
      // 设置用户积分不足
      await PointsAccount.update(
        { total_points: 100, available_points: 100 },
        { where: { user_id: testUser.id } }
      );

      const orderData = {
        user_id: testUser.id,
        items: [
          {
            product_id: testProduct.id,
            quantity: 2,
            price: testProduct.price,
            points_price: testProduct.points_price
          }
        ],
        shipping_address: {
          recipient_name: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detail: '某某街道123号'
        },
        payment_method: 'points'
      };

      await expect(orderService.createOrder(orderData)).rejects.toThrow('积分不足');
    });

    it('should throw error for insufficient stock', async () => {
      const orderData = {
        user_id: testUser.id,
        items: [
          {
            product_id: testProduct.id,
            quantity: 100, // 超过库存
            price: testProduct.price,
            points_price: testProduct.points_price
          }
        ],
        shipping_address: {
          recipient_name: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detail: '某某街道123号'
        },
        payment_method: 'points'
      };

      await expect(orderService.createOrder(orderData)).rejects.toThrow('库存不足');
    });
  });

  describe('getOrderById', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user_id: testUser.id,
        order_number: 'TEST' + Date.now(),
        status: 'pending',
        payment_method: 'points',
        total_amount: 200,
        total_points: 2000,
        shipping_address: JSON.stringify({
          recipient_name: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detail: '某某街道123号'
        })
      });

      await OrderItem.create({
        order_id: testOrder.id,
        product_id: testProduct.id,
        quantity: 2,
        price: testProduct.price,
        points_price: testProduct.points_price,
        total_amount: testProduct.price * 2,
        total_points: testProduct.points_price * 2
      });
    });

    it('should return order with items', async () => {
      const order = await orderService.getOrderById(testOrder.id);

      expect(order).toBeDefined();
      expect(order.id).toBe(testOrder.id);
      expect(order.OrderItems).toHaveLength(1);
      expect(order.OrderItems[0].Product).toBeDefined();
    });

    it('should return null for non-existent order', async () => {
      const order = await orderService.getOrderById(99999);
      expect(order).toBeNull();
    });
  });

  describe('getUserOrders', () => {
    beforeEach(async () => {
      // 创建多个订单
      for (let i = 0; i < 3; i++) {
        await Order.create({
          user_id: testUser.id,
          order_number: 'TEST' + Date.now() + i,
          status: i === 0 ? 'pending' : 'completed',
          payment_method: 'points',
          total_amount: 100 * (i + 1),
          total_points: 1000 * (i + 1),
          shipping_address: JSON.stringify({
            recipient_name: '张三',
            phone: '13800138000',
            province: '北京市',
            city: '北京市',
            district: '朝阳区',
            detail: '某某街道123号'
          })
        });
      }
    });

    it('should return user orders with pagination', async () => {
      const result = await orderService.getUserOrders(testUser.id, { page: 1, limit: 10 });

      expect(result.orders).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
    });

    it('should filter orders by status', async () => {
      const result = await orderService.getUserOrders(testUser.id, {
        status: 'pending',
        page: 1,
        limit: 10
      });

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].status).toBe('pending');
    });
  });

  describe('cancelOrder', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user_id: testUser.id,
        order_number: 'TEST' + Date.now(),
        status: 'pending',
        payment_method: 'points',
        total_amount: 200,
        total_points: 2000,
        shipping_address: JSON.stringify({
          recipient_name: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detail: '某某街道123号'
        })
      });

      await OrderItem.create({
        order_id: testOrder.id,
        product_id: testProduct.id,
        quantity: 2,
        price: testProduct.price,
        points_price: testProduct.points_price,
        total_amount: testProduct.price * 2,
        total_points: testProduct.points_price * 2
      });

      // 模拟库存已减少和积分已扣减
      await Product.update(
        { stock: testProduct.stock - 2 },
        { where: { id: testProduct.id } }
      );
      await PointsAccount.update(
        { available_points: 5000 - 2000 },
        { where: { user_id: testUser.id } }
      );
    });

    it('should cancel order and restore stock and points', async () => {
      await orderService.cancelOrder(testOrder.id, testUser.id, '用户取消');

      // 验证订单状态
      const updatedOrder = await Order.findByPk(testOrder.id);
      expect(updatedOrder.status).toBe('cancelled');
      expect(updatedOrder.cancel_reason).toBe('用户取消');

      // 验证库存恢复
      const updatedProduct = await Product.findByPk(testProduct.id);
      expect(updatedProduct.stock).toBe(testProduct.stock);

      // 验证积分恢复
      const pointsAccount = await PointsAccount.findOne({ where: { user_id: testUser.id } });
      expect(pointsAccount.available_points).toBe(5000);
    });

    it('should throw error for non-cancellable order', async () => {
      await testOrder.update({ status: 'shipped' });

      await expect(
        orderService.cancelOrder(testOrder.id, testUser.id, '用户取消')
      ).rejects.toThrow('订单状态不允许取消');
    });

    it('should throw error for unauthorized cancellation', async () => {
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123',
        phone: '13900139999'
      });

      await expect(
        orderService.cancelOrder(testOrder.id, anotherUser.id, '用户取消')
      ).rejects.toThrow('无权限操作此订单');
    });
  });

  describe('confirmOrder', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user_id: testUser.id,
        order_number: 'TEST' + Date.now(),
        status: 'pending',
        payment_method: 'points',
        total_amount: 200,
        total_points: 2000,
        shipping_address: JSON.stringify({
          recipient_name: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detail: '某某街道123号'
        })
      });
    });

    it('should confirm order successfully', async () => {
      await orderService.confirmOrder(testOrder.id);

      const updatedOrder = await Order.findByPk(testOrder.id);
      expect(updatedOrder.status).toBe('confirmed');
      expect(updatedOrder.confirmed_at).toBeDefined();
    });

    it('should throw error for non-pending order', async () => {
      await testOrder.update({ status: 'cancelled' });

      await expect(orderService.confirmOrder(testOrder.id)).rejects.toThrow('订单状态错误');
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate unique order number', async () => {
      const orderNumber1 = await orderService.generateOrderNumber();
      const orderNumber2 = await orderService.generateOrderNumber();

      expect(orderNumber1).toBeDefined();
      expect(orderNumber2).toBeDefined();
      expect(orderNumber1).not.toBe(orderNumber2);
      expect(orderNumber1).toMatch(/^\d{14}\d{6}$/);
    });
  });
});