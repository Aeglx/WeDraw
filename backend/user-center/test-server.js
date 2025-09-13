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
    rows: rows,
    total: total
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
    rows: rows,
    total: total
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
    rows: rows,
    total: total
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
    rows: rows,
    total: total
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
});

module.exports = app;