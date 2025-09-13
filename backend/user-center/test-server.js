const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 模拟角色列表API
app.get('/api/user-center/system/role/list', (req, res) => {
  const { pageNum = 1, pageSize = 10 } = req.query;
  
  // 模拟角色数据
  const mockRoles = [
    { roleId: 1, roleName: '超级管理员', roleKey: 'admin', roleSort: 1, status: '0', createTime: '2024-01-01 10:00:00' },
    { roleId: 2, roleName: '普通用户', roleKey: 'user', roleSort: 2, status: '0', createTime: '2024-01-01 10:00:00' },
    { roleId: 3, roleName: '访客', roleKey: 'guest', roleSort: 3, status: '0', createTime: '2024-01-01 10:00:00' }
  ];
  
  const total = mockRoles.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const rows = mockRoles.slice(start, end);
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      rows: rows,
      total: total
    }
  });
});

// 模拟微信公众号粉丝列表API
app.get('/api/wechat-official/api/fans', (req, res) => {
  const { pageNum = 1, pageSize = 10 } = req.query;
  
  // 模拟粉丝数据
  const mockFans = [
    { openid: 'o1234567890abcdef1', nickname: '张三', headimgurl: 'https://example.com/avatar1.jpg', subscribe_time: '2024-01-01 10:00:00', tagid_list: [1, 2] },
    { openid: 'o1234567890abcdef2', nickname: '李四', headimgurl: 'https://example.com/avatar2.jpg', subscribe_time: '2024-01-02 11:00:00', tagid_list: [1] },
    { openid: 'o1234567890abcdef3', nickname: '王五', headimgurl: 'https://example.com/avatar3.jpg', subscribe_time: '2024-01-03 12:00:00', tagid_list: [2, 3] },
    { openid: 'o1234567890abcdef4', nickname: '赵六', headimgurl: 'https://example.com/avatar4.jpg', subscribe_time: '2024-01-04 13:00:00', tagid_list: [1, 3] },
    { openid: 'o1234567890abcdef5', nickname: '钱七', headimgurl: 'https://example.com/avatar5.jpg', subscribe_time: '2024-01-05 14:00:00', tagid_list: [2] }
  ];
  
  const total = mockFans.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const rows = mockFans.slice(start, end);
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      rows: rows,
      total: total
    }
  });
});

// 模拟微信公众号标签列表API
app.get('/api/wechat-official/api/tags', (req, res) => {
  // 模拟标签数据
  const mockTags = [
    { id: 1, name: 'VIP用户', count: 150 },
    { id: 2, name: '活跃用户', count: 300 },
    { id: 3, name: '新用户', count: 80 }
  ];
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: mockTags
  });
});

// 模拟微信公众号菜单列表API
app.get('/api/wechat-official/api/menus', (req, res) => {
  const { pageNum = 1, pageSize = 10 } = req.query;
  
  // 模拟菜单数据
  const mockMenus = [
    { 
      id: 1, 
      name: '主菜单', 
      type: 'click', 
      key: 'main_menu', 
      url: '', 
      parentId: 0, 
      sort: 1, 
      status: 1, 
      createTime: '2024-01-01 10:00:00',
      children: [
        { id: 11, name: '关于我们', type: 'view', key: '', url: 'https://example.com/about', parentId: 1, sort: 1, status: 1 },
        { id: 12, name: '联系客服', type: 'click', key: 'contact_service', url: '', parentId: 1, sort: 2, status: 1 }
      ]
    },
    { 
      id: 2, 
      name: '服务中心', 
      type: 'click', 
      key: 'service_center', 
      url: '', 
      parentId: 0, 
      sort: 2, 
      status: 1, 
      createTime: '2024-01-02 10:00:00',
      children: [
        { id: 21, name: '积分查询', type: 'view', key: '', url: 'https://example.com/points', parentId: 2, sort: 1, status: 1 },
        { id: 22, name: '订单查询', type: 'view', key: '', url: 'https://example.com/orders', parentId: 2, sort: 2, status: 1 }
      ]
    },
    { 
      id: 3, 
      name: '活动专区', 
      type: 'view', 
      key: '', 
      url: 'https://example.com/activities', 
      parentId: 0, 
      sort: 3, 
      status: 1, 
      createTime: '2024-01-03 10:00:00',
      children: []
    }
  ];
  
  const total = mockMenus.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const rows = mockMenus.slice(start, end);
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      rows: rows,
      total: total
    }
  });
});

// 模拟微信公众号消息列表API
app.get('/api/wechat/message/list', (req, res) => {
  const { pageNum = 1, pageSize = 10 } = req.query;
  
  // 模拟消息数据
  const mockMessages = [
    {
      id: 1,
      title: '欢迎关注我们的公众号',
      messageType: 'text',
      content: '感谢您关注我们的公众号，我们将为您提供最新的资讯和服务。',
      status: 'published',
      readCount: 1250,
      likeCount: 89,
      shareCount: 23,
      sendTime: '2024-01-15 10:30:00',
      createTime: '2024-01-15 09:00:00'
    },
    {
      id: 2,
      title: '新年活动通知',
      messageType: 'news',
      content: '新年期间我们将举办多项精彩活动，敬请期待！',
      status: 'published',
      readCount: 980,
      likeCount: 156,
      shareCount: 45,
      sendTime: '2024-01-10 14:20:00',
      createTime: '2024-01-10 13:00:00'
    },
    {
      id: 3,
      title: '产品更新说明',
      messageType: 'text',
      content: '我们的产品进行了重要更新，新增了多项实用功能。',
      status: 'draft',
      readCount: 0,
      likeCount: 0,
      shareCount: 0,
      sendTime: null,
      createTime: '2024-01-08 16:45:00'
    },
    {
      id: 4,
      title: '客服时间调整通知',
      messageType: 'text',
      content: '为了更好地为您服务，我们调整了客服工作时间。',
      status: 'published',
      readCount: 756,
      likeCount: 34,
      shareCount: 12,
      sendTime: '2024-01-05 11:15:00',
      createTime: '2024-01-05 10:30:00'
    },
    {
      id: 5,
      title: '会员权益升级',
      messageType: 'news',
      content: '我们为会员用户提供了更多专属权益和优惠。',
      status: 'published',
      readCount: 1456,
      likeCount: 203,
      shareCount: 67,
      sendTime: '2024-01-03 15:30:00',
      createTime: '2024-01-03 14:00:00'
    }
  ];
  
  const total = mockMessages.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const rows = mockMessages.slice(start, end);
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      rows: rows,
      total: total
    }
  });
});

// 模拟企业微信通讯录用户列表API
app.get('/api/wecom/api/contacts/users', (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  
  // 模拟企业微信用户数据
  const mockUsers = [
    { userid: 'zhangsan', name: '张三', department: [1], position: '产品经理', mobile: '13800138001', email: 'zhangsan@company.com', avatar: 'https://example.com/avatar1.jpg', status: 1 },
    { userid: 'lisi', name: '李四', department: [1, 2], position: '开发工程师', mobile: '13800138002', email: 'lisi@company.com', avatar: 'https://example.com/avatar2.jpg', status: 1 },
    { userid: 'wangwu', name: '王五', department: [2], position: '测试工程师', mobile: '13800138003', email: 'wangwu@company.com', avatar: 'https://example.com/avatar3.jpg', status: 1 },
    { userid: 'zhaoliu', name: '赵六', department: [3], position: '运营专员', mobile: '13800138004', email: 'zhaoliu@company.com', avatar: 'https://example.com/avatar4.jpg', status: 1 },
    { userid: 'qianqi', name: '钱七', department: [1, 3], position: '设计师', mobile: '13800138005', email: 'qianqi@company.com', avatar: 'https://example.com/avatar5.jpg', status: 1 }
  ];
  
  // 搜索过滤
  let filteredUsers = mockUsers;
  if (search) {
    filteredUsers = mockUsers.filter(user => 
      user.name.includes(search) || 
      user.userid.includes(search) || 
      user.position.includes(search)
    );
  }
  
  const total = filteredUsers.length;
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const rows = filteredUsers.slice(start, end);
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      rows: rows,
      total: total
    }
  });
});

// 模拟企业微信部门列表API
app.get('/api/wecom/api/contacts/departments', (req, res) => {
  const { tree = false } = req.query;
  
  // 模拟部门数据
  const mockDepartments = [
    { id: 1, name: '技术部', parentid: 0, order: 1 },
    { id: 2, name: '产品部', parentid: 0, order: 2 },
    { id: 3, name: '运营部', parentid: 0, order: 3 },
    { id: 4, name: '前端组', parentid: 1, order: 1 },
    { id: 5, name: '后端组', parentid: 1, order: 2 },
    { id: 6, name: '测试组', parentid: 1, order: 3 }
  ];
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      departments: mockDepartments
    }
  });
});

// 模拟企业微信通讯录统计信息API
app.get('/api/wecom/api/contacts/statistics', (req, res) => {
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      totalUsers: 156,
      activeUsers: 142,
      totalDepartments: 12,
      newUsersThisMonth: 8,
      lastSyncTime: '2024-01-15 14:30:00'
    }
  });
});

// 模拟积分商城商品列表API
app.get('/api/points-mall/products/list', (req, res) => {
  const { page = 1, limit = 10, name = '', sku = '', category_id = '', status = '' } = req.query;
  
  // 模拟商品数据
  const mockProducts = [
    { id: 1, name: 'iPhone 15 Pro', sku: 'IP15P001', price: 999, points: 99900, category_id: 1, category_name: '数码产品', stock: 50, status: 1, image: 'https://example.com/iphone15.jpg', description: '最新款iPhone' },
    { id: 2, name: 'MacBook Air M3', sku: 'MBA001', price: 1299, points: 129900, category_id: 1, category_name: '数码产品', stock: 30, status: 1, image: 'https://example.com/macbook.jpg', description: '轻薄笔记本' },
    { id: 3, name: '星巴克咖啡券', sku: 'SB001', price: 30, points: 3000, category_id: 2, category_name: '生活用品', stock: 100, status: 1, image: 'https://example.com/starbucks.jpg', description: '星巴克中杯咖啡券' },
    { id: 4, name: 'Nike运动鞋', sku: 'NK001', price: 120, points: 12000, category_id: 3, category_name: '服装鞋帽', stock: 25, status: 1, image: 'https://example.com/nike.jpg', description: '经典款运动鞋' },
    { id: 5, name: '小米手环7', sku: 'MI001', price: 199, points: 19900, category_id: 1, category_name: '数码产品', stock: 80, status: 1, image: 'https://example.com/miband.jpg', description: '智能手环' }
  ];
  
  // 搜索过滤
  let filteredProducts = mockProducts;
  if (name) {
    filteredProducts = filteredProducts.filter(product => product.name.includes(name));
  }
  if (sku) {
    filteredProducts = filteredProducts.filter(product => product.sku.includes(sku));
  }
  if (category_id) {
    filteredProducts = filteredProducts.filter(product => product.category_id == category_id);
  }
  if (status !== '') {
    filteredProducts = filteredProducts.filter(product => product.status == status);
  }
  
  // 分页
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      rows: paginatedProducts,
      total: filteredProducts.length
    }
  });
});

// 模拟积分商城分类列表API
app.get('/api/points-mall/categories/list', (req, res) => {
  const mockCategories = [
    { id: 1, name: '数码产品', sort: 1, status: 1, product_count: 15 },
    { id: 2, name: '生活用品', sort: 2, status: 1, product_count: 8 },
    { id: 3, name: '服装鞋帽', sort: 3, status: 1, product_count: 12 },
    { id: 4, name: '美食饮品', sort: 4, status: 1, product_count: 6 },
    { id: 5, name: '图书文具', sort: 5, status: 1, product_count: 4 }
  ];
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      rows: mockCategories,
      total: mockCategories.length
    }
  });
});

// 模拟积分商城统计信息API
app.get('/api/points-mall/products/statistics', (req, res) => {
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      totalProducts: 45,
      activeProducts: 38,
      totalCategories: 5,
      totalOrders: 1256,
      totalPoints: 2580000,
      monthlyOrders: 89,
      monthlyPoints: 156000
    }
  });
});

// 模拟积分商城订单列表API
app.get('/api/points-mall/orders/list', (req, res) => {
  const { page = 1, limit = 10, order_no = '', user_phone = '', status = '', payment_method = '' } = req.query;
  
  // 模拟订单数据
  const mockOrders = [
    { id: 1, order_no: 'PM202401150001', user_id: 1, user_name: '张三', user_phone: '13800138001', total_amount: 999, total_points: 99900, status: 'completed', payment_method: 'points', created_at: '2024-01-15 10:30:00', updated_at: '2024-01-15 10:35:00' },
    { id: 2, order_no: 'PM202401150002', user_id: 2, user_name: '李四', user_phone: '13800138002', total_amount: 30, total_points: 3000, status: 'pending', payment_method: 'points', created_at: '2024-01-15 11:20:00', updated_at: '2024-01-15 11:20:00' },
    { id: 3, order_no: 'PM202401150003', user_id: 3, user_name: '王五', user_phone: '13800138003', total_amount: 120, total_points: 12000, status: 'shipped', payment_method: 'points', created_at: '2024-01-15 14:15:00', updated_at: '2024-01-15 16:30:00' },
    { id: 4, order_no: 'PM202401150004', user_id: 4, user_name: '赵六', user_phone: '13800138004', total_amount: 199, total_points: 19900, status: 'cancelled', payment_method: 'points', created_at: '2024-01-15 15:45:00', updated_at: '2024-01-15 16:00:00' },
    { id: 5, order_no: 'PM202401150005', user_id: 5, user_name: '钱七', user_phone: '13800138005', total_amount: 1299, total_points: 129900, status: 'completed', payment_method: 'points', created_at: '2024-01-15 16:20:00', updated_at: '2024-01-15 18:45:00' }
  ];
  
  // 搜索过滤
  let filteredOrders = mockOrders;
  if (order_no) {
    filteredOrders = filteredOrders.filter(order => order.order_no.includes(order_no));
  }
  if (user_phone) {
    filteredOrders = filteredOrders.filter(order => order.user_phone.includes(user_phone));
  }
  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }
  if (payment_method) {
    filteredOrders = filteredOrders.filter(order => order.payment_method === payment_method);
  }
  
  // 分页
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      rows: paginatedOrders,
      total: filteredOrders.length,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// 模拟积分商城订单统计信息API
app.get('/api/points-mall/orders/statistics', (req, res) => {
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      totalOrders: 1256,
      pendingOrders: 45,
      shippedOrders: 89,
      completedOrders: 1098,
      cancelledOrders: 24,
      totalAmount: 2580000,
      totalPoints: 25800000,
      monthlyOrders: 89,
      monthlyAmount: 156000,
      monthlyPoints: 1560000,
      todayOrders: 12,
      todayAmount: 8900,
      todayPoints: 89000
    }
  });
});

// 模拟积分商城物流公司列表API
app.get('/api/points-mall/orders/express-companies', (req, res) => {
  const mockExpressCompanies = [
    { id: 1, name: '顺丰速运', code: 'SF', status: 1, sort: 1 },
    { id: 2, name: '圆通速递', code: 'YTO', status: 1, sort: 2 },
    { id: 3, name: '中通快递', code: 'ZTO', status: 1, sort: 3 },
    { id: 4, name: '申通快递', code: 'STO', status: 1, sort: 4 },
    { id: 5, name: '韵达速递', code: 'YD', status: 1, sort: 5 },
    { id: 6, name: '百世快递', code: 'HTKY', status: 1, sort: 6 },
    { id: 7, name: '京东物流', code: 'JD', status: 1, sort: 7 },
    { id: 8, name: '邮政EMS', code: 'EMS', status: 1, sort: 8 },
    { id: 9, name: '德邦快递', code: 'DBL', status: 1, sort: 9 },
    { id: 10, name: '天天快递', code: 'HHTT', status: 1, sort: 10 }
  ];
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      rows: mockExpressCompanies,
      total: mockExpressCompanies.length
    }
  });
});

// 模拟系统配置列表API
app.get('/api/system/config/list', (req, res) => {
  const { pageNum = 1, pageSize = 10, configName, configKey, configType } = req.query;
  
  // 模拟系统配置数据
  const mockConfigs = [
    { configId: 1, configName: '主框架页-默认皮肤样式名称', configKey: 'sys.index.skinName', configValue: 'skin-blue', configType: 'Y', remark: '蓝色 skin-blue、绿色 skin-green、紫色 skin-purple、红色 skin-red、黄色 skin-yellow', createTime: '2024-01-01 10:00:00' },
    { configId: 2, configName: '用户管理-账号初始密码', configKey: 'sys.user.initPassword', configValue: '123456', configType: 'Y', remark: '初始化密码 123456', createTime: '2024-01-01 10:00:00' },
    { configId: 3, configName: '主框架页-侧边栏主题', configKey: 'sys.index.sideTheme', configValue: 'theme-dark', configType: 'Y', remark: '深色主题theme-dark，浅色主题theme-light', createTime: '2024-01-01 10:00:00' },
    { configId: 4, configName: '账号自助-验证码开关', configKey: 'sys.account.captchaEnabled', configValue: 'true', configType: 'Y', remark: '是否开启验证码功能（true开启，false关闭）', createTime: '2024-01-01 10:00:00' },
    { configId: 5, configName: '账号自助-是否开启用户注册功能', configKey: 'sys.account.registerUser', configValue: 'false', configType: 'Y', remark: '是否开启注册用户功能（true开启，false关闭）', createTime: '2024-01-01 10:00:00' },
    { configId: 6, configName: '文件上传-文件大小', configKey: 'sys.uploadFile.baseDir', configValue: '/home/wedraw', configType: 'Y', remark: '文件上传路径', createTime: '2024-01-01 10:00:00' },
    { configId: 7, configName: '系统邮件-SMTP服务器', configKey: 'sys.mail.host', configValue: 'smtp.qq.com', configType: 'Y', remark: 'SMTP服务器地址', createTime: '2024-01-01 10:00:00' },
    { configId: 8, configName: '系统邮件-SMTP端口', configKey: 'sys.mail.port', configValue: '465', configType: 'Y', remark: 'SMTP服务器端口', createTime: '2024-01-01 10:00:00' },
    { configId: 9, configName: '系统邮件-发件人邮箱', configKey: 'sys.mail.username', configValue: 'wedraw@qq.com', configType: 'Y', remark: '发件人邮箱地址', createTime: '2024-01-01 10:00:00' },
    { configId: 10, configName: '系统邮件-发件人密码', configKey: 'sys.mail.password', configValue: '******', configType: 'Y', remark: '发件人邮箱密码', createTime: '2024-01-01 10:00:00' }
  ];
  
  // 过滤数据
  let filteredConfigs = mockConfigs;
  
  if (configName) {
    filteredConfigs = filteredConfigs.filter(config => 
      config.configName.toLowerCase().includes(configName.toLowerCase())
    );
  }
  
  if (configKey) {
    filteredConfigs = filteredConfigs.filter(config => 
      config.configKey.toLowerCase().includes(configKey.toLowerCase())
    );
  }
  
  if (configType) {
    filteredConfigs = filteredConfigs.filter(config => 
      config.configType === configType
    );
  }
  
  const total = filteredConfigs.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const rows = filteredConfigs.slice(start, end);
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: {
      rows: rows,
      total: total
    }
  });
});

// 模拟系统信息API
app.get('/api/system/info', (req, res) => {
  // 模拟系统信息数据
  const systemInfo = {
    system: {
      name: 'WeDraw管理系统',
      version: '1.0.0',
      author: 'WeDraw Team',
      description: '基于Vue3 + Element Plus的现代化管理系统',
      buildTime: '2024-01-01 10:00:00',
      copyright: 'Copyright © 2024 WeDraw. All rights reserved.'
    },
    server: {
      os: 'Windows 11',
      arch: 'x64',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        free: Math.round((process.memoryUsage().heapTotal - process.memoryUsage().heapUsed) / 1024 / 1024) + 'MB'
      },
      cpu: {
        usage: Math.floor(Math.random() * 50) + 10 + '%',
        cores: require('os').cpus().length
      }
    },
    database: {
      type: 'MySQL',
      version: '8.0.33',
      status: 'connected',
      connectionPool: {
        active: Math.floor(Math.random() * 10) + 5,
        idle: Math.floor(Math.random() * 5) + 2,
        total: 20
      }
    },
    redis: {
      version: '7.0.11',
      status: 'connected',
      memory: {
        used: Math.floor(Math.random() * 100) + 50 + 'MB',
        peak: Math.floor(Math.random() * 150) + 100 + 'MB'
      },
      connections: Math.floor(Math.random() * 20) + 10
    },
    statistics: {
      totalUsers: 1250,
      activeUsers: 89,
      totalOrders: 3456,
      todayOrders: 23,
      totalRevenue: 125678.90,
      todayRevenue: 2345.67
    }
  };
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: systemInfo
  });
});

// 模拟系统状态API
app.get('/api/system/status', (req, res) => {
  console.log('🔍 System Status API called');
  
  const systemStatus = {
    overall: 'healthy',
    services: {
      database: {
        status: 'online',
        responseTime: '12ms',
        lastCheck: new Date().toISOString()
      },
      redis: {
        status: 'online',
        responseTime: '3ms',
        lastCheck: new Date().toISOString()
      },
      apiGateway: {
        status: 'online',
        responseTime: '8ms',
        lastCheck: new Date().toISOString()
      },
      userCenter: {
        status: 'online',
        responseTime: '15ms',
        lastCheck: new Date().toISOString()
      },
      pointsMall: {
        status: 'online',
        responseTime: '20ms',
        lastCheck: new Date().toISOString()
      }
    },
    performance: {
      cpuUsage: 45.2,
      memoryUsage: 68.5,
      diskUsage: 32.1,
      networkLatency: 8
    },
    alerts: [
      {
        level: 'warning',
        message: 'CPU使用率较高',
        timestamp: new Date(Date.now() - 300000).toISOString()
      }
    ],
    lastUpdated: new Date().toISOString()
  };
  
  res.json({
    code: 200,
    msg: '查询成功',
    data: systemStatus
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Test User Center Service started on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Role API: http://localhost:${PORT}/api/user-center/system/role/list`);
  console.log(`👥 Fans API: http://localhost:${PORT}/api/wechat-official/api/fans`);
  console.log(`🏷️  Tags API: http://localhost:${PORT}/api/wechat-official/api/tags`);
  console.log(`📋 Menus API: http://localhost:${PORT}/api/wechat-official/api/menus`);
  console.log(`💬 Messages API: http://localhost:${PORT}/api/wechat/message/list`);
  console.log(`👤 WeWork Users API: http://localhost:${PORT}/api/wecom/api/contacts/users`);
  console.log(`🏢 WeWork Departments API: http://localhost:${PORT}/api/wecom/api/contacts/departments`);
  console.log(`📊 WeWork Statistics API: http://localhost:${PORT}/api/wecom/api/contacts/statistics`);
  console.log(`🛍️  Points Mall Products API: http://localhost:${PORT}/api/points-mall/products/list`);
  console.log(`📂 Points Mall Categories API: http://localhost:${PORT}/api/points-mall/categories/list`);
  console.log(`📈 Points Mall Statistics API: http://localhost:${PORT}/api/points-mall/products/statistics`);
  console.log(`📦 Points Mall Orders API: http://localhost:${PORT}/api/points-mall/orders/list`);
  console.log(`📊 Points Mall Orders Statistics API: http://localhost:${PORT}/api/points-mall/orders/statistics`);
  console.log(`🚚 Points Mall Express Companies API: http://localhost:${PORT}/api/points-mall/orders/express-companies`);
  console.log(`⚙️  System Config List API: http://localhost:${PORT}/api/system/config/list`);
  console.log(`ℹ️  System Info API: http://localhost:${PORT}/api/system/info`);
  console.log(`🔍 System Status API: http://localhost:${PORT}/api/system/status`);
});

module.exports = app;