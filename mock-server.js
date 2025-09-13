const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// Mock API 响应
const mockResponse = (data = {}, message = 'success') => ({
  code: 200,
  message,
  data,
  timestamp: new Date().toISOString()
});

// 微信粉丝相关API
app.get('/api/wechat-official/api/fans', (req, res) => {
  res.json(mockResponse({
    list: [],
    total: 0,
    page: 1,
    pageSize: 10
  }));
});

app.get('/api/wechat-official/api/fans/:id', (req, res) => {
  res.json(mockResponse({
    id: req.params.id,
    nickname: 'Mock User',
    avatar: '',
    subscribeTime: new Date().toISOString()
  }));
});

// 微信标签相关API
app.get('/api/wechat-official/api/tags', (req, res) => {
  res.json(mockResponse({
    list: [],
    total: 0
  }));
});

// 公众号菜单管理接口
app.get('/api/wechat-official/api/menus', (req, res) => {
  res.json(mockResponse({
    list: [
      {
        id: 1,
        name: '主菜单1',
        type: 'click',
        key: 'MENU_1',
        order: 1,
        published: true,
        createTime: new Date().toISOString()
      },
      {
        id: 2,
        name: '主菜单2',
        type: 'view',
        url: 'https://example.com',
        order: 2,
        published: false,
        createTime: new Date().toISOString()
      }
    ],
    total: 2
  }));
});

app.get('/api/wechat-official/api/menus/:id', (req, res) => {
  const menuId = parseInt(req.params.id);
  res.json(mockResponse({
    id: menuId,
    name: '菜单名称',
    type: 'click',
    key: 'MENU_KEY',
    order: 1,
    published: true,
    createTime: new Date().toISOString()
  }));
});

app.post('/api/wechat-official/api/menus', (req, res) => {
  res.json(mockResponse({
    id: Date.now(),
    ...req.body,
    createTime: new Date().toISOString()
  }, '菜单添加成功'));
});

app.put('/api/wechat-official/api/menus/:id', (req, res) => {
  res.json(mockResponse({
    id: parseInt(req.params.id),
    ...req.body,
    updateTime: new Date().toISOString()
  }, '菜单修改成功'));
});

app.delete('/api/wechat-official/api/menus/:id', (req, res) => {
  res.json(mockResponse({}, '菜单删除成功'));
});

app.post('/api/wechat-official/api/menus/publish', (req, res) => {
  res.json(mockResponse({}, '菜单发布成功'));
});

app.get('/api/wechat-official/api/menus/wechat', (req, res) => {
  res.json(mockResponse({
    button: [
      {
        name: '主菜单1',
        type: 'click',
        key: 'MENU_1'
      },
      {
        name: '主菜单2',
        type: 'view',
        url: 'https://example.com'
      }
    ]
  }));
});

// 公众号消息管理接口
// 查询消息列表
app.get('/api/wechat/message/list', (req, res) => {
  const { pageNum = 1, pageSize = 10, messageType, status, startTime, endTime } = req.query;
  const messages = [
    {
      id: 1,
      title: '欢迎关注我们的公众号',
      messageType: 'text',
      content: '感谢您关注我们的公众号，我们将为您提供最新的产品信息和优质服务。',
      status: 'sent',
      sendTime: '2024-01-15 10:30:00',
      readCount: 1250,
      likeCount: 89,
      shareCount: 23,
      createTime: '2024-01-15 10:00:00'
    },
    {
      id: 2,
      title: '新年活动通知',
      messageType: 'news',
      content: '新年特惠活动即将开始，敬请期待！',
      status: 'draft',
      sendTime: null,
      readCount: 0,
      likeCount: 0,
      shareCount: 0,
      createTime: '2024-01-14 15:20:00'
    },
    {
      id: 3,
      title: '产品更新说明',
      messageType: 'image',
      content: '我们的产品进行了重要更新，请查看详细说明。',
      status: 'sending',
      sendTime: '2024-01-16 09:00:00',
      readCount: 0,
      likeCount: 0,
      shareCount: 0,
      createTime: '2024-01-15 18:45:00'
    }
  ];
  
  res.json(mockResponse({
    list: messages,
    total: messages.length
  }));
});

// 查询消息详情
app.get('/api/wechat/message/:id', (req, res) => {
  const { id } = req.params;
  res.json(mockResponse({
    id: parseInt(id),
    title: '欢迎关注我们的公众号',
    messageType: 'text',
    content: '感谢您关注我们的公众号，我们将为您提供最新的产品信息和优质服务。',
    status: 'sent',
    sendTime: '2024-01-15 10:30:00',
    readCount: 1250,
    likeCount: 89,
    shareCount: 23,
    createTime: '2024-01-15 10:00:00',
    remark: '这是一条欢迎消息'
  }));
});

// 新增消息
app.post('/api/wechat/message', (req, res) => {
  res.json(mockResponse({}, '新增成功'));
});

// 修改消息
app.put('/api/wechat/message', (req, res) => {
  res.json(mockResponse({}, '修改成功'));
});

// 删除消息
app.delete('/api/wechat/message/:id', (req, res) => {
  res.json(mockResponse({}, '删除成功'));
});

// 发送消息
app.post('/api/wechat/message/send', (req, res) => {
  res.json(mockResponse({}, '发送成功'));
});

// 群发消息
app.post('/api/wechat/message/broadcast', (req, res) => {
  res.json(mockResponse({
    taskId: 'broadcast_' + Date.now(),
    estimatedCount: 5000
  }, '群发成功'));
});

// 获取消息统计
app.get('/api/wechat/message/stats', (req, res) => {
  res.json(mockResponse({
    totalMessages: 156,
    sentMessages: 120,
    draftMessages: 25,
    sendingMessages: 11,
    totalReads: 45600,
    totalLikes: 2340,
    totalShares: 890
  }));
});

// 导出消息记录
app.get('/api/wechat/message/export', (req, res) => {
  res.json(mockResponse({
    downloadUrl: '/downloads/wechat_messages_' + Date.now() + '.xlsx'
  }, '导出成功'));
});

// 获取消息模板列表
app.get('/api/wechat/message/templates', (req, res) => {
  res.json(mockResponse([
    {
      id: 1,
      name: '欢迎消息模板',
      content: '欢迎关注{{公司名称}}，我们将为您提供优质服务！'
    },
    {
      id: 2,
      name: '活动通知模板',
      content: '{{活动名称}}即将开始，时间：{{活动时间}}，地点：{{活动地点}}'
    },
    {
      id: 3,
      name: '节日祝福模板',
      content: '{{节日名称}}快乐！{{公司名称}}祝您和家人{{祝福语}}！'
    }
  ]));
});

// 预览消息
app.post('/api/wechat/message/preview', (req, res) => {
  res.json(mockResponse({
    previewUrl: '/preview/message_' + Date.now() + '.html'
  }, '预览成功'));
});

// 仪表盘相关API
app.get('/api/dashboard/stats', (req, res) => {
  res.json(mockResponse({
    userCount: 1234,
    wechatFans: 5678,
    orderCount: 890,
    revenue: 12345.67,
    todayUsers: 45,
    todayOrders: 23,
    todayRevenue: 1234.56
  }));
});

app.get('/api/dashboard/user-growth', (req, res) => {
  const dates = [];
  const users = [];
  
  // 生成最近30天的数据
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
    users.push(Math.floor(Math.random() * 100) + 50);
  }
  
  res.json(mockResponse({
    dates,
    users
  }));
});

app.get('/api/dashboard/order-stats', (req, res) => {
  res.json(mockResponse({
    categories: ['待付款', '待发货', '待收货', '已完成', '已取消'],
    values: [45, 123, 67, 234, 12]
  }));
});

app.get('/api/dashboard/revenue', (req, res) => {
  const months = [];
  const revenue = [];
  
  // 生成最近12个月的数据
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    revenue.push(Math.floor(Math.random() * 50000) + 10000);
  }
  
  res.json(mockResponse({
    months,
    revenue
  }));
});

// 用户管理相关API
app.get('/user-center/system/user/list', (req, res) => {
  const { pageNum = 1, pageSize = 10, userName, phonenumber, status } = req.query;
  
  let users = [
    {
      userId: 1,
      userName: 'admin',
      nickName: '管理员',
      dept: { deptName: '总公司', deptId: 1 },
      phonenumber: '15888888888',
      email: 'admin@wedraw.com',
      sex: '0',
      status: '0',
      createTime: '2023-01-01 00:00:00',
      remark: '管理员账户'
    },
    {
      userId: 2,
      userName: 'test',
      nickName: '测试用户',
      dept: { deptName: '技术部', deptId: 2 },
      phonenumber: '15666666666',
      email: 'test@wedraw.com',
      sex: '1',
      status: '0',
      createTime: '2023-01-02 00:00:00',
      remark: '测试用户账户'
    },
    {
      userId: 3,
      userName: 'user1',
      nickName: '普通用户1',
      dept: { deptName: '市场部', deptId: 3 },
      phonenumber: '13777777777',
      email: 'user1@wedraw.com',
      sex: '0',
      status: '0',
      createTime: '2023-01-03 00:00:00',
      remark: '普通用户'
    },
    {
      userId: 4,
      userName: 'user2',
      nickName: '普通用户2',
      dept: { deptName: '销售部', deptId: 4 },
      phonenumber: '13888888888',
      email: 'user2@wedraw.com',
      sex: '1',
      status: '1',
      createTime: '2023-01-04 00:00:00',
      remark: '普通用户'
    }
  ];
  
  // 过滤条件
  if (userName) {
    users = users.filter(user => user.userName.includes(userName) || user.nickName.includes(userName));
  }
  if (phonenumber) {
    users = users.filter(user => user.phonenumber.includes(phonenumber));
  }
  if (status) {
    users = users.filter(user => user.status === status);
  }
  
  const total = users.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const list = users.slice(start, end);
  
  res.json(mockResponse({
    list,
    total,
    pageNum: parseInt(pageNum),
    pageSize: parseInt(pageSize)
  }));
});

app.get('/user-center/system/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = {
    userId: userId,
    userName: 'test',
    nickName: '测试用户',
    phonenumber: '15666666666',
    email: 'test@wedraw.com',
    sex: '0',
    status: '0',
    deptId: 2,
    postIds: [1],
    roleIds: [2],
    remark: '测试用户'
  };
  
  res.json(mockResponse(user));
});

app.post('/user-center/system/user', (req, res) => {
  res.json(mockResponse({}, '用户添加成功'));
});

app.put('/user-center/system/user', (req, res) => {
  res.json(mockResponse({}, '用户修改成功'));
});

app.delete('/user-center/system/user/:id', (req, res) => {
  res.json(mockResponse({}, '用户删除成功'));
});

app.put('/user-center/system/user/resetPwd', (req, res) => {
  res.json(mockResponse({}, '密码重置成功'));
});

app.put('/user-center/system/user/changeStatus', (req, res) => {
  res.json(mockResponse({}, '状态修改成功'));
});

app.get('/user-center/system/user/deptTree', (req, res) => {
  res.json(mockResponse([
    {
      id: 1,
      label: '总公司',
      children: [
        { id: 2, label: '技术部' },
        { id: 3, label: '市场部' },
        { id: 4, label: '销售部' },
        { id: 5, label: '人事部' }
      ]
    }
  ]));
});

// 企业微信通讯录管理接口
app.get('/api/wecom/contacts/list', (req, res) => {
  const { page = 1, limit = 20, search, status, department_id } = req.query
  
  let users = [
    {
      userid: 'zhangsan',
      name: '张三',
      english_name: 'Zhang San',
      position: '前端开发工程师',
      mobile: '13800138001',
      email: 'zhangsan@company.com',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      gender: 1,
      telephone: '021-12345678',
      address: '上海市浦东新区',
      status: 1,
      departments: [{ department_id: 1, name: '技术部' }],
      created_at: '2024-01-15T08:30:00Z',
      updated_at: '2024-01-20T10:15:00Z'
    },
    {
      userid: 'lisi',
      name: '李四',
      english_name: 'Li Si',
      position: '后端开发工程师',
      mobile: '13800138002',
      email: 'lisi@company.com',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      gender: 1,
      telephone: '021-12345679',
      address: '上海市徐汇区',
      status: 1,
      departments: [{ department_id: 1, name: '技术部' }],
      created_at: '2024-01-16T09:00:00Z',
      updated_at: '2024-01-21T11:30:00Z'
    },
    {
      userid: 'wangwu',
      name: '王五',
      english_name: 'Wang Wu',
      position: '产品经理',
      mobile: '13800138003',
      email: 'wangwu@company.com',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      gender: 2,
      telephone: '021-12345680',
      address: '上海市静安区',
      status: 1,
      departments: [{ department_id: 2, name: '产品部' }],
      created_at: '2024-01-17T10:30:00Z',
      updated_at: '2024-01-22T14:45:00Z'
    }
  ]
  
  // 模拟搜索过滤
  if (search) {
    users = users.filter(user => 
      user.name.includes(search) || 
      user.mobile.includes(search) || 
      user.email.includes(search)
    )
  }
  
  if (status) {
    users = users.filter(user => user.status == status)
  }
  
  if (department_id) {
    users = users.filter(user => 
      user.departments.some(dept => dept.department_id == department_id)
    )
  }
  
  const total = users.length
  const start = (page - 1) * limit
  const end = start + parseInt(limit)
  const paginatedUsers = users.slice(start, end)
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      users: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total
      }
    }
  })
})

app.get('/api/wecom/contacts/:userid', (req, res) => {
  const { userid } = req.params
  
  const user = {
    userid: userid,
    name: '张三',
    english_name: 'Zhang San',
    position: '前端开发工程师',
    mobile: '13800138001',
    email: 'zhangsan@company.com',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    gender: 1,
    telephone: '021-12345678',
    address: '上海市浦东新区',
    status: 1,
    departments: [{ department_id: 1, name: '技术部' }],
    created_at: '2024-01-15T08:30:00Z',
    updated_at: '2024-01-20T10:15:00Z'
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: user
  })
})

app.post('/api/wecom/contacts/sync', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      users: {
        created: 5,
        updated: 12,
        deleted: 1
      },
      departments: {
        created: 2,
        updated: 3,
        deleted: 0
      }
    }
  })
})

app.get('/api/wecom/contacts/export', (req, res) => {
  const csvContent = 'userid,name,position,mobile,email,department\nzhangsan,张三,前端开发工程师,13800138001,zhangsan@company.com,技术部'
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv')
  res.send(csvContent)
})

app.get('/api/wecom/contacts/statistics', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      users: {
        total: 156,
        active: 142,
        inactive: 14
      },
      departments: {
        total: 12
      },
      lastSyncTime: new Date().toISOString()
    }
  })
})

// 企业微信部门管理接口
app.get('/api/wecom/department/tree', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: [
      {
        department_id: 1,
        name: '技术部',
        userCount: 25,
        children: [
          {
            department_id: 11,
            name: '前端组',
            userCount: 8,
            children: []
          },
          {
            department_id: 12,
            name: '后端组',
            userCount: 12,
            children: []
          },
          {
            department_id: 13,
            name: '测试组',
            userCount: 5,
            children: []
          }
        ]
      },
      {
        department_id: 2,
        name: '产品部',
        userCount: 15,
        children: [
          {
            department_id: 21,
            name: '产品设计',
            userCount: 8,
            children: []
          },
          {
            department_id: 22,
            name: '用户研究',
            userCount: 7,
            children: []
          }
        ]
      },
      {
        department_id: 3,
        name: '运营部',
        userCount: 20,
        children: []
      }
    ]
  })
})

// 企业微信群聊管理接口
app.get('/api/wecom/groups/list', (req, res) => {
  const { page = 1, limit = 20, name, owner, chatType, startDate, endDate } = req.query
  
  let groups = [
    {
      chatid: 'group001',
      name: '技术部讨论群',
      owner: '张三',
      ownerAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      chatType: 'department',
      memberCount: 25,
      notice: '欢迎大家积极讨论技术问题',
      createTime: '2024-01-15T08:30:00Z',
      lastActiveTime: '2024-01-25T16:45:00Z'
    },
    {
      chatid: 'group002',
      name: '产品需求讨论',
      owner: '王五',
      ownerAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      chatType: 'project',
      memberCount: 15,
      notice: '产品需求讨论和评审',
      createTime: '2024-01-16T09:00:00Z',
      lastActiveTime: '2024-01-25T14:30:00Z'
    },
    {
      chatid: 'group003',
      name: '全员通知群',
      owner: '李四',
      ownerAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      chatType: 'group',
      memberCount: 156,
      notice: '公司重要通知发布群',
      createTime: '2024-01-10T10:00:00Z',
      lastActiveTime: '2024-01-25T18:20:00Z'
    }
  ]
  
  // 模拟搜索过滤
  if (name) {
    groups = groups.filter(group => group.name.includes(name))
  }
  
  if (owner) {
    groups = groups.filter(group => group.owner.includes(owner))
  }
  
  if (chatType) {
    groups = groups.filter(group => group.chatType === chatType)
  }
  
  const total = groups.length
  const start = (page - 1) * limit
  const end = start + parseInt(limit)
  const paginatedGroups = groups.slice(start, end)
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      groups: paginatedGroups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total
      }
    }
  })
})

app.get('/api/wecom/groups/:chatid', (req, res) => {
  const { chatid } = req.params
  
  const group = {
    chatid: chatid,
    name: '技术部讨论群',
    owner: '张三',
    ownerAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    chatType: 'department',
    memberCount: 25,
    notice: '欢迎大家积极讨论技术问题',
    createTime: '2024-01-15T08:30:00Z',
    lastActiveTime: '2024-01-25T16:45:00Z'
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: group
  })
})

app.get('/api/wecom/groups/:chatid/members', (req, res) => {
  const { chatid } = req.params
  
  const members = [
    {
      userid: 'zhangsan',
      name: '张三',
      department: '技术部',
      type: 1, // 1-群主 2-管理员 3-普通成员
      joinTime: '2024-01-15T08:30:00Z'
    },
    {
      userid: 'lisi',
      name: '李四',
      department: '技术部',
      type: 2,
      joinTime: '2024-01-16T09:00:00Z'
    },
    {
      userid: 'wangwu',
      name: '王五',
      department: '产品部',
      type: 3,
      joinTime: '2024-01-17T10:30:00Z'
    }
  ]
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      members: members
    }
  })
})

app.put('/api/wecom/groups/:chatid', (req, res) => {
  const { chatid } = req.params
  const { name, chatType, notice } = req.body
  
  res.json({
    code: 200,
    message: '更新成功',
    data: {
      chatid: chatid,
      name: name,
      chatType: chatType,
      notice: notice
    }
  })
})

app.delete('/api/wecom/groups/:chatid', (req, res) => {
  const { chatid } = req.params
  
  res.json({
    code: 200,
    message: '删除成功',
    data: {
      chatid: chatid
    }
  })
})

app.delete('/api/wecom/groups/:chatid/members/:userid', (req, res) => {
  const { chatid, userid } = req.params
  
  res.json({
    code: 200,
    message: '移除成功',
    data: {
      chatid: chatid,
      userid: userid
    }
  })
})

app.post('/api/wecom/groups/sync', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      groups: {
        created: 3,
        updated: 8,
        deleted: 1
      }
    }
  })
})

app.get('/api/wecom/groups/export', (req, res) => {
  const csvContent = 'chatid,name,owner,chatType,memberCount,createTime\ngroup001,技术部讨论群,张三,department,25,2024-01-15T08:30:00Z'
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=groups.csv')
  res.send(csvContent)
})

app.get('/api/wecom/groups/statistics', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      total: 25,
      active: 18,
      totalMembers: 456,
      lastSyncTime: new Date().toISOString()
    }
  })
})

// 小程序用户管理接口
app.get('/api/miniprogram/users/list', (req, res) => {
  const { page = 1, size = 10, keyword, status, tag } = req.query;
  
  const mockUsers = [
    {
      id: 1,
      openid: 'oMgHVjngRipVsoxm6o09c1dNPetg',
      unionid: 'o6_bmasdasdsad6_2sgVt7hMZOPfL',
      nickname: '张三',
      avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL1byctY955FrMQueH2FWxtZB0xLMBFTuQXjCqjjGTUzV3iaYaKCLEVwm5m2w2gE0vyQOJoiaEsf2A/132',
      gender: 1,
      city: '北京',
      province: '北京',
      country: '中国',
      language: 'zh_CN',
      subscribe_time: '2024-01-15 10:30:00',
      last_visit_time: '2024-01-20 15:45:00',
      visit_count: 25,
      status: 'active',
      tags: ['VIP', '活跃用户'],
      points: 1250,
      level: 'Gold',
      phone: '138****8888',
      created_at: '2024-01-15 10:30:00',
      updated_at: '2024-01-20 15:45:00'
    },
    {
      id: 2,
      openid: 'oMgHVjngRipVsoxm6o09c1dNPetH',
      unionid: 'o6_bmasdasdsad6_2sgVt7hMZOPfM',
      nickname: '李四',
      avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL1byctY955FrMQueH2FWxtZB0xLMBFTuQXjCqjjGTUzV3iaYaKCLEVwm5m2w2gE0vyQOJoiaEsf2B/132',
      gender: 2,
      city: '上海',
      province: '上海',
      country: '中国',
      language: 'zh_CN',
      subscribe_time: '2024-01-10 09:20:00',
      last_visit_time: '2024-01-19 14:30:00',
      visit_count: 18,
      status: 'active',
      tags: ['新用户'],
      points: 680,
      level: 'Silver',
      phone: '139****9999',
      created_at: '2024-01-10 09:20:00',
      updated_at: '2024-01-19 14:30:00'
    },
    {
      id: 3,
      openid: 'oMgHVjngRipVsoxm6o09c1dNPetI',
      unionid: 'o6_bmasdasdsad6_2sgVt7hMZOPfN',
      nickname: '王五',
      avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL1byctY955FrMQueH2FWxtZB0xLMBFTuQXjCqjjGTUzV3iaYaKCLEVwm5m2w2gE0vyQOJoiaEsf2C/132',
      gender: 1,
      city: '广州',
      province: '广东',
      country: '中国',
      language: 'zh_CN',
      subscribe_time: '2024-01-05 16:45:00',
      last_visit_time: '2024-01-18 11:20:00',
      visit_count: 42,
      status: 'inactive',
      tags: ['老用户', '高价值'],
      points: 2150,
      level: 'Platinum',
      phone: '137****7777',
      created_at: '2024-01-05 16:45:00',
      updated_at: '2024-01-18 11:20:00'
    }
  ];
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: mockUsers,
      total: mockUsers.length,
      page: parseInt(page),
      size: parseInt(size)
    }
  });
});

app.get('/api/miniprogram/users/:id', (req, res) => {
  const { id } = req.params;
  
  const mockUser = {
    id: parseInt(id),
    openid: 'oMgHVjngRipVsoxm6o09c1dNPetg',
    unionid: 'o6_bmasdasdsad6_2sgVt7hMZOPfL',
    nickname: '张三',
    avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL1byctY955FrMQueH2FWxtZB0xLMBFTuQXjCqjjGTUzV3iaYaKCLEVwm5m2w2gE0vyQOJoiaEsf2A/132',
    gender: 1,
    city: '北京',
    province: '北京',
    country: '中国',
    language: 'zh_CN',
    subscribe_time: '2024-01-15 10:30:00',
    last_visit_time: '2024-01-20 15:45:00',
    visit_count: 25,
    status: 'active',
    tags: ['VIP', '活跃用户'],
    points: 1250,
    level: 'Gold',
    phone: '138****8888',
    created_at: '2024-01-15 10:30:00',
    updated_at: '2024-01-20 15:45:00',
    behavior_data: {
      page_views: 156,
      share_count: 8,
      favorite_count: 12,
      purchase_count: 3,
      last_purchase_time: '2024-01-18 14:20:00'
    }
  };
  
  res.json({
    code: 200,
    message: 'success',
    data: mockUser
  });
});

app.put('/api/miniprogram/users/:id/status', (req, res) => {
  res.json({
    code: 200,
    message: '用户状态更新成功'
  });
});

app.put('/api/miniprogram/users/:id/tags', (req, res) => {
  res.json({
    code: 200,
    message: '用户标签更新成功'
  });
});

app.post('/api/miniprogram/users/batch', (req, res) => {
  res.json({
    code: 200,
    message: '批量操作成功',
    data: {
      success_count: 5,
      fail_count: 0
    }
  });
});

app.post('/api/miniprogram/users/sync', (req, res) => {
  res.json({
    code: 200,
    message: '用户数据同步成功',
    data: {
      sync_count: 128,
      new_count: 15,
      update_count: 113
    }
  });
});

app.get('/api/miniprogram/users/export', (req, res) => {
  res.json({
    code: 200,
    message: '导出任务已创建',
    data: {
      task_id: 'export_' + Date.now(),
      download_url: '/api/download/users_' + Date.now() + '.xlsx'
    }
  });
});

app.get('/api/miniprogram/users/statistics', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      total_users: 1234,
      active_users: 890,
      new_users_today: 25,
      new_users_week: 156,
      retention_rate: 0.68,
      avg_visit_duration: 180
    }
  });
});

// 小程序模板消息管理接口
app.get('/api/miniprogram/template-messages/list', (req, res) => {
  const { page = 1, size = 10, status, template_id } = req.query;
  
  const mockMessages = [
    {
      id: 1,
      template_id: 'AT0002',
      title: '订单支付成功通知',
      content: '您的订单已支付成功，我们将尽快为您发货。',
      touser: 'oMgHVjngRipVsoxm6o09c1dNPetg',
      status: 'success',
      send_time: '2024-01-20 15:30:00',
      click_count: 1,
      data: {
        thing1: { value: '商品名称' },
        amount2: { value: '￥99.00' },
        time3: { value: '2024-01-20 15:30:00' }
      },
      created_at: '2024-01-20 15:30:00'
    },
    {
      id: 2,
      template_id: 'AT0003',
      title: '活动提醒',
      content: '您关注的活动即将开始，请及时参与。',
      touser: 'oMgHVjngRipVsoxm6o09c1dNPetH',
      status: 'pending',
      send_time: null,
      click_count: 0,
      data: {
        thing1: { value: '春节特惠活动' },
        time2: { value: '2024-01-25 10:00:00' },
        thing3: { value: '全场8折优惠' }
      },
      created_at: '2024-01-20 14:15:00'
    },
    {
      id: 3,
      template_id: 'AT0004',
      title: '服务到期提醒',
      content: '您的会员服务即将到期，请及时续费。',
      touser: 'oMgHVjngRipVsoxm6o09c1dNPetI',
      status: 'failed',
      send_time: '2024-01-20 13:45:00',
      click_count: 0,
      error_msg: '用户拒收消息',
      data: {
        thing1: { value: 'VIP会员服务' },
        time2: { value: '2024-01-25 23:59:59' },
        thing3: { value: '立即续费享受优惠' }
      },
      created_at: '2024-01-20 13:45:00'
    }
  ];
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: mockMessages,
      total: mockMessages.length,
      page: parseInt(page),
      size: parseInt(size)
    }
  });
});

app.get('/api/miniprogram/template-messages/:id', (req, res) => {
  const { id } = req.params;
  
  const mockMessage = {
    id: parseInt(id),
    template_id: 'AT0002',
    title: '订单支付成功通知',
    content: '您的订单已支付成功，我们将尽快为您发货。',
    touser: 'oMgHVjngRipVsoxm6o09c1dNPetg',
    status: 'success',
    send_time: '2024-01-20 15:30:00',
    click_count: 1,
    data: {
      thing1: { value: '商品名称' },
      amount2: { value: '￥99.00' },
      time3: { value: '2024-01-20 15:30:00' }
    },
    created_at: '2024-01-20 15:30:00',
    page: 'pages/order/detail?id=123',
    miniprogram_state: 'formal'
  };
  
  res.json({
    code: 200,
    message: 'success',
    data: mockMessage
  });
});

app.post('/api/miniprogram/template-messages/send', (req, res) => {
  res.json({
    code: 200,
    message: '模板消息发送成功',
    data: {
      msgid: 'msg_' + Date.now()
    }
  });
});

app.post('/api/miniprogram/template-messages/batch-send', (req, res) => {
  res.json({
    code: 200,
    message: '批量发送成功',
    data: {
      success_count: 8,
      fail_count: 2,
      task_id: 'batch_' + Date.now()
    }
  });
});

app.get('/api/miniprogram/templates/list', (req, res) => {
  const mockTemplates = [
    {
      template_id: 'AT0002',
      title: '订单支付成功通知',
      content: '{{thing1.DATA}}\n支付金额：{{amount2.DATA}}\n支付时间：{{time3.DATA}}',
      example: '商品名称\n支付金额：￥99.00\n支付时间：2024-01-20 15:30:00',
      category_id: 1,
      category_name: '交易服务',
      status: 'active',
      created_at: '2024-01-15 10:00:00'
    },
    {
      template_id: 'AT0003',
      title: '活动提醒',
      content: '活动名称：{{thing1.DATA}}\n活动时间：{{time2.DATA}}\n活动详情：{{thing3.DATA}}',
      example: '活动名称：春节特惠活动\n活动时间：2024-01-25 10:00:00\n活动详情：全场8折优惠',
      category_id: 2,
      category_name: '营销推广',
      status: 'active',
      created_at: '2024-01-16 11:30:00'
    },
    {
      template_id: 'AT0004',
      title: '服务到期提醒',
      content: '服务名称：{{thing1.DATA}}\n到期时间：{{time2.DATA}}\n温馨提示：{{thing3.DATA}}',
      example: '服务名称：VIP会员服务\n到期时间：2024-01-25 23:59:59\n温馨提示：立即续费享受优惠',
      category_id: 3,
      category_name: '客户服务',
      status: 'active',
      created_at: '2024-01-17 14:20:00'
    }
  ];
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: mockTemplates,
      total: mockTemplates.length
    }
  });
});

app.get('/api/miniprogram/template-messages/statistics', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      total_sent: 1256,
      success_count: 1189,
      failed_count: 67,
      success_rate: '94.7%',
      today_sent: 45,
      click_rate: '23.5%',
      daily_stats: [
        { date: '2024-01-20', sent: 45, success: 42, failed: 3, clicks: 12 },
        { date: '2024-01-19', sent: 38, success: 36, failed: 2, clicks: 8 },
        { date: '2024-01-18', sent: 52, success: 48, failed: 4, clicks: 15 }
      ]
    }
  });
});

app.delete('/api/miniprogram/template-messages/:id', (req, res) => {
  res.json({
    code: 200,
    message: '消息删除成功'
  });
});

app.post('/api/miniprogram/template-messages/resend/:id', (req, res) => {
  res.json({
    code: 200,
    message: '消息重发成功',
    data: {
      new_msgid: 'msg_' + Date.now()
    }
  });
});

app.get('/api/miniprogram/template-messages/export', (req, res) => {
  res.json({
    code: 200,
    message: '导出任务已创建',
    data: {
      task_id: 'export_' + Date.now(),
      download_url: '/api/download/template_messages_' + Date.now() + '.xlsx'
    }
  });
});

// 积分商城商品管理接口
app.get('/api/points-mall/products/list', (req, res) => {
  const { page = 1, size = 10, name, category_id, status, min_points, max_points } = req.query;
  
  const mockProducts = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      sku: 'IP15P001',
      category_id: 1,
      category_name: '数码产品',
      description: '最新款iPhone 15 Pro，性能强劲',
      points: 15000,
      cash_price: 999.00,
      stock: 50,
      low_stock_threshold: 10,
      sales_count: 128,
      image: 'https://example.com/images/iphone15pro.jpg',
      status: 'active',
      is_featured: true,
      detail: 'iPhone 15 Pro详细介绍...',
      created_at: '2024-01-15 10:00:00',
      updated_at: '2024-01-20 15:30:00'
    },
    {
      id: 2,
      name: 'MacBook Air M2',
      sku: 'MBA001',
      category_id: 1,
      category_name: '数码产品',
      description: 'Apple MacBook Air M2芯片笔记本',
      points: 25000,
      cash_price: 1299.00,
      stock: 30,
      low_stock_threshold: 5,
      sales_count: 85,
      image: 'https://example.com/images/macbook-air.jpg',
      status: 'active',
      is_featured: false,
      detail: 'MacBook Air M2详细介绍...',
      created_at: '2024-01-16 11:30:00',
      updated_at: '2024-01-19 14:20:00'
    },
    {
      id: 3,
      name: '星巴克咖啡券',
      sku: 'SB001',
      category_id: 2,
      category_name: '生活服务',
      description: '星巴克中杯咖啡兑换券',
      points: 500,
      cash_price: 0,
      stock: 200,
      low_stock_threshold: 20,
      sales_count: 456,
      image: 'https://example.com/images/starbucks.jpg',
      status: 'active',
      is_featured: true,
      detail: '星巴克咖啡券详细介绍...',
      created_at: '2024-01-10 09:15:00',
      updated_at: '2024-01-18 16:45:00'
    },
    {
      id: 4,
      name: '小米手环7',
      sku: 'MI007',
      category_id: 1,
      category_name: '数码产品',
      description: '小米手环7智能运动手环',
      points: 800,
      cash_price: 199.00,
      stock: 5,
      low_stock_threshold: 10,
      sales_count: 234,
      image: 'https://example.com/images/mi-band7.jpg',
      status: 'active',
      is_featured: false,
      detail: '小米手环7详细介绍...',
      created_at: '2024-01-12 14:20:00',
      updated_at: '2024-01-17 10:30:00'
    }
  ];
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: mockProducts,
      total: mockProducts.length,
      page: parseInt(page),
      size: parseInt(size)
    }
  });
});

app.get('/api/points-mall/products/:id', (req, res) => {
  const { id } = req.params;
  
  const mockProduct = {
    id: parseInt(id),
    name: 'iPhone 15 Pro',
    sku: 'IP15P001',
    category_id: 1,
    category_name: '数码产品',
    description: '最新款iPhone 15 Pro，性能强劲',
    points: 15000,
    cash_price: 999.00,
    stock: 50,
    low_stock_threshold: 10,
    sales_count: 128,
    image: 'https://example.com/images/iphone15pro.jpg',
    status: 'active',
    is_featured: true,
    detail: 'iPhone 15 Pro采用A17 Pro芯片，配备专业级摄像头系统，支持Action Button等全新功能。',
    created_at: '2024-01-15 10:00:00',
    updated_at: '2024-01-20 15:30:00',
    attributes: [
      { name: '颜色', value: '深空黑色' },
      { name: '存储', value: '256GB' },
      { name: '网络', value: '5G' }
    ]
  };
  
  res.json({
    code: 200,
    message: 'success',
    data: mockProduct
  });
});

app.post('/api/points-mall/products', (req, res) => {
  res.json({
    code: 200,
    message: '商品创建成功',
    data: {
      id: Date.now()
    }
  });
});

app.put('/api/points-mall/products/:id', (req, res) => {
  res.json({
    code: 200,
    message: '商品更新成功'
  });
});

app.delete('/api/points-mall/products/:id', (req, res) => {
  res.json({
    code: 200,
    message: '商品删除成功'
  });
});

app.put('/api/points-mall/products/:id/status', (req, res) => {
  res.json({
    code: 200,
    message: '商品状态更新成功'
  });
});

app.get('/api/points-mall/products/statistics', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      total_products: 156,
      active_products: 128,
      low_stock_products: 8,
      total_value: '¥2,580,000'
    }
  });
});

app.get('/api/points-mall/categories/list', (req, res) => {
  const mockCategories = [
    {
      id: 1,
      name: '数码产品',
      description: '手机、电脑、智能设备等',
      sort_order: 1,
      status: 'active',
      product_count: 45,
      created_at: '2024-01-10 10:00:00'
    },
    {
      id: 2,
      name: '生活服务',
      description: '餐饮、娱乐、出行等服务',
      sort_order: 2,
      status: 'active',
      product_count: 68,
      created_at: '2024-01-10 10:30:00'
    },
    {
      id: 3,
      name: '家居用品',
      description: '家具、装饰、日用品等',
      sort_order: 3,
      status: 'active',
      product_count: 32,
      created_at: '2024-01-10 11:00:00'
    },
    {
      id: 4,
      name: '服装配饰',
      description: '服装、鞋帽、配饰等',
      sort_order: 4,
      status: 'active',
      product_count: 11,
      created_at: '2024-01-10 11:30:00'
    }
  ];
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: mockCategories,
      total: mockCategories.length
    }
  });
});

app.get('/api/points-mall/products/export', (req, res) => {
  res.json({
    code: 200,
    message: '导出任务已创建',
    data: {
      task_id: 'export_' + Date.now(),
      download_url: '/api/download/products_' + Date.now() + '.xlsx'
    }
  });
});

app.get('/api/points-mall/products/template', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      download_url: '/api/download/product_template.xlsx'
    }
  });
});

app.post('/api/points-mall/products/import', (req, res) => {
  res.json({
    code: 200,
    message: '商品导入成功',
    data: {
      success_count: 25,
      fail_count: 3,
      total_count: 28
    }
  });
});

// 积分商城订单管理接口
app.get('/api/points-mall/orders/list', (req, res) => {
  const { page = 1, size = 10, order_no, user_name, product_name, status } = req.query;
  
  const mockOrders = [
    {
      id: 1,
      order_no: 'PM202401150001',
      user_id: 1001,
      user_name: '张三',
      user_phone: '13800138001',
      product_id: 1,
      product_name: 'iPhone 15 Pro',
      product_sku: 'IP15P001',
      product_image: 'https://example.com/images/iphone15pro.jpg',
      quantity: 1,
      points_cost: 15000,
      cash_cost: 0,
      total_amount: 15000,
      status: 'completed',
      address: '北京市朝阳区xxx街道xxx号',
      remark: '请尽快发货',
      express_company: '顺丰速运',
      tracking_number: 'SF1234567890',
      created_at: '2024-01-15 10:30:00',
      updated_at: '2024-01-16 14:20:00'
    },
    {
      id: 2,
      order_no: 'PM202401150002',
      user_id: 1002,
      user_name: '李四',
      user_phone: '13800138002',
      product_id: 3,
      product_name: '星巴克咖啡券',
      product_sku: 'SB001',
      product_image: 'https://example.com/images/starbucks.jpg',
      quantity: 2,
      points_cost: 1000,
      cash_cost: 0,
      total_amount: 1000,
      status: 'paid',
      address: '上海市浦东新区xxx路xxx号',
      remark: '',
      express_company: '',
      tracking_number: '',
      created_at: '2024-01-15 11:45:00',
      updated_at: '2024-01-15 11:45:00'
    },
    {
      id: 3,
      order_no: 'PM202401150003',
      user_id: 1003,
      user_name: '王五',
      user_phone: '13800138003',
      product_id: 2,
      product_name: 'MacBook Air M2',
      product_sku: 'MBA001',
      product_image: 'https://example.com/images/macbook-air.jpg',
      quantity: 1,
      points_cost: 25000,
      cash_cost: 299.00,
      total_amount: 25299,
      status: 'processing',
      address: '广州市天河区xxx大道xxx号',
      remark: '工作日配送',
      express_company: '',
      tracking_number: '',
      created_at: '2024-01-15 15:20:00',
      updated_at: '2024-01-16 09:30:00'
    }
  ];
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: mockOrders,
      total: mockOrders.length,
      page: parseInt(page),
      size: parseInt(size)
    }
  });
});

app.get('/api/points-mall/orders/:id', (req, res) => {
  const { id } = req.params;
  
  const mockOrder = {
    id: parseInt(id),
    order_no: 'PM202401150001',
    user_id: 1001,
    user_name: '张三',
    user_phone: '13800138001',
    product_id: 1,
    product_name: 'iPhone 15 Pro',
    product_sku: 'IP15P001',
    product_image: 'https://example.com/images/iphone15pro.jpg',
    quantity: 1,
    points_cost: 15000,
    cash_cost: 0,
    total_amount: 15000,
    status: 'completed',
    address: '北京市朝阳区xxx街道xxx号',
    remark: '请尽快发货',
    express_company: '顺丰速运',
    tracking_number: 'SF1234567890',
    created_at: '2024-01-15 10:30:00',
    updated_at: '2024-01-16 14:20:00'
  };
  
  res.json({
    code: 200,
    message: 'success',
    data: mockOrder
  });
});

app.put('/api/points-mall/orders/:id/status', (req, res) => {
  res.json({
    code: 200,
    message: '订单状态更新成功'
  });
});

app.put('/api/points-mall/orders/:id/ship', (req, res) => {
  res.json({
    code: 200,
    message: '订单发货成功'
  });
});

app.put('/api/points-mall/orders/:id/cancel', (req, res) => {
  res.json({
    code: 200,
    message: '订单取消成功'
  });
});

app.get('/api/points-mall/orders/statistics', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      pending_orders: 12,
      completed_orders: 156,
      cancelled_orders: 8,
      total_points: '2,580,000'
    }
  });
});

app.get('/api/points-mall/orders/export', (req, res) => {
  res.json({
    code: 200,
    message: '导出任务已创建',
    data: {
      task_id: 'export_' + Date.now(),
      download_url: '/api/download/orders_' + Date.now() + '.xlsx'
    }
  });
});

// 积分商城优惠券管理接口
app.get('/api/points-mall/coupons/list', (req, res) => {
  const { page = 1, size = 10, name, type, status } = req.query;
  
  const mockCoupons = [
    {
      id: 1,
      name: '新用户专享券',
      type: 'discount',
      discount_amount: 50,
      discount_rate: 0,
      points_amount: 0,
      min_amount: 200,
      total_count: 1000,
      issued_count: 856,
      used_count: 423,
      per_user_limit: 1,
      start_time: '2024-01-01 00:00:00',
      end_time: '2024-12-31 23:59:59',
      status: 'active',
      applicable_type: 'all',
      applicable_ids: [],
      description: '新用户注册专享优惠券',
      created_at: '2024-01-01 10:00:00',
      updated_at: '2024-01-15 16:30:00'
    },
    {
      id: 2,
      name: '数码产品8折券',
      type: 'percentage',
      discount_amount: 0,
      discount_rate: 8.0,
      points_amount: 0,
      min_amount: 500,
      total_count: 500,
      issued_count: 234,
      used_count: 89,
      per_user_limit: 2,
      start_time: '2024-01-15 00:00:00',
      end_time: '2024-02-15 23:59:59',
      status: 'active',
      applicable_type: 'category',
      applicable_ids: [1],
      description: '数码产品专享8折优惠',
      created_at: '2024-01-10 14:20:00',
      updated_at: '2024-01-12 11:45:00'
    },
    {
      id: 3,
      name: '积分兑换券',
      type: 'points',
      discount_amount: 0,
      discount_rate: 0,
      points_amount: 1000,
      min_amount: 0,
      total_count: 2000,
      issued_count: 1567,
      used_count: 1234,
      per_user_limit: 5,
      start_time: '2024-01-01 00:00:00',
      end_time: '2024-06-30 23:59:59',
      status: 'active',
      applicable_type: 'all',
      applicable_ids: [],
      description: '免费获得1000积分',
      created_at: '2024-01-01 09:30:00',
      updated_at: '2024-01-14 15:20:00'
    },
    {
      id: 4,
      name: '免邮券',
      type: 'shipping',
      discount_amount: 0,
      discount_rate: 0,
      points_amount: 0,
      min_amount: 100,
      total_count: 800,
      issued_count: 456,
      used_count: 234,
      per_user_limit: 3,
      start_time: '2024-01-10 00:00:00',
      end_time: '2024-03-10 23:59:59',
      status: 'active',
      applicable_type: 'all',
      applicable_ids: [],
      description: '满100元免邮费',
      created_at: '2024-01-08 16:45:00',
      updated_at: '2024-01-13 10:15:00'
    }
  ];
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: mockCoupons,
      total: mockCoupons.length,
      page: parseInt(page),
      size: parseInt(size)
    }
  });
});

app.get('/api/points-mall/coupons/:id', (req, res) => {
  const { id } = req.params;
  
  const mockCoupon = {
    id: parseInt(id),
    name: '新用户专享券',
    type: 'discount',
    discount_amount: 50,
    discount_rate: 0,
    points_amount: 0,
    min_amount: 200,
    total_count: 1000,
    issued_count: 856,
    used_count: 423,
    per_user_limit: 1,
    start_time: '2024-01-01 00:00:00',
    end_time: '2024-12-31 23:59:59',
    status: 'active',
    applicable_type: 'all',
    applicable_ids: [],
    description: '新用户注册专享优惠券，满200减50元',
    created_at: '2024-01-01 10:00:00',
    updated_at: '2024-01-15 16:30:00'
  };
  
  res.json({
    code: 200,
    message: 'success',
    data: mockCoupon
  });
});

app.post('/api/points-mall/coupons', (req, res) => {
  res.json({
    code: 200,
    message: '优惠券创建成功',
    data: {
      id: Date.now()
    }
  });
});

app.put('/api/points-mall/coupons/:id', (req, res) => {
  res.json({
    code: 200,
    message: '优惠券更新成功'
  });
});

app.delete('/api/points-mall/coupons/:id', (req, res) => {
  res.json({
    code: 200,
    message: '优惠券删除成功'
  });
});

app.put('/api/points-mall/coupons/:id/status', (req, res) => {
  res.json({
    code: 200,
    message: '优惠券状态更新成功'
  });
});

app.get('/api/points-mall/coupons/statistics', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      active_coupons: 45,
      used_coupons: 1980,
      expired_coupons: 156,
      total_discount: '¥125,600'
    }
  });
});

app.get('/api/points-mall/coupons/export', (req, res) => {
  res.json({
    code: 200,
    message: '导出任务已创建',
    data: {
      task_id: 'export_' + Date.now(),
      download_url: '/api/download/coupons_' + Date.now() + '.xlsx'
    }
  });
});

// 系统管理 - 系统设置接口
app.get('/api/system/settings', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      basic: {
        site_name: 'WeDraw管理系统',
        site_logo: '/logo.png',
        site_description: '企业级绘图协作平台',
        site_keywords: '绘图,协作,企业',
        copyright: '© 2024 WeDraw. All rights reserved.',
        icp_number: '京ICP备12345678号'
      },
      email: {
        smtp_host: 'smtp.qq.com',
        smtp_port: 587,
        smtp_user: 'admin@wedraw.com',
        smtp_password: '******',
        smtp_encryption: 'tls',
        from_name: 'WeDraw系统',
        from_email: 'noreply@wedraw.com'
      },
      storage: {
        driver: 'local',
        local_path: '/uploads',
        oss_endpoint: '',
        oss_bucket: '',
        oss_access_key: '',
        oss_secret_key: '',
        max_file_size: 10,
        allowed_extensions: 'jpg,jpeg,png,gif,pdf,doc,docx'
      },
      security: {
        password_min_length: 8,
        password_complexity: true,
        login_attempts: 5,
        lockout_duration: 30,
        session_timeout: 120,
        two_factor_auth: false
      },
      cache: {
        driver: 'redis',
        redis_host: '127.0.0.1',
        redis_port: 6379,
        redis_password: '',
        redis_database: 0,
        default_ttl: 3600
      }
    }
  });
});

app.put('/api/system/settings', (req, res) => {
  res.json({
    code: 200,
    message: '设置保存成功'
  });
});

app.post('/api/system/settings/reset', (req, res) => {
  res.json({
    code: 200,
    message: '设置重置成功'
  });
});

app.post('/api/system/settings/test-email', (req, res) => {
  res.json({
    code: 200,
    message: '邮件发送成功'
  });
});

app.post('/api/system/settings/test-redis', (req, res) => {
  res.json({
    code: 200,
    message: 'Redis连接成功'
  });
});

app.post('/api/system/settings/clear-cache', (req, res) => {
  res.json({
    code: 200,
    message: '缓存清理成功'
  });
});

// 系统管理 - 部门管理接口
app.get('/api/system/dept/list', (req, res) => {
  const mockDepts = [
    {
      id: 1,
      parent_id: 0,
      dept_name: '总公司',
      order_num: 0,
      leader: '张三',
      phone: '13800138000',
      email: 'admin@wedraw.com',
      status: 'active',
      created_at: '2024-01-01 10:00:00',
      children: [
        {
          id: 2,
          parent_id: 1,
          dept_name: '技术部',
          order_num: 1,
          leader: '李四',
          phone: '13800138001',
          email: 'tech@wedraw.com',
          status: 'active',
          created_at: '2024-01-01 10:00:00',
          children: [
            {
              id: 4,
              parent_id: 2,
              dept_name: '前端组',
              order_num: 1,
              leader: '王五',
              phone: '13800138003',
              email: 'frontend@wedraw.com',
              status: 'active',
              created_at: '2024-01-01 10:00:00'
            },
            {
              id: 5,
              parent_id: 2,
              dept_name: '后端组',
              order_num: 2,
              leader: '赵六',
              phone: '13800138004',
              email: 'backend@wedraw.com',
              status: 'active',
              created_at: '2024-01-01 10:00:00'
            }
          ]
        },
        {
          id: 3,
          parent_id: 1,
          dept_name: '市场部',
          order_num: 2,
          leader: '孙七',
          phone: '13800138002',
          email: 'market@wedraw.com',
          status: 'active',
          created_at: '2024-01-01 10:00:00'
        }
      ]
    }
  ];
  
  res.json({
    code: 200,
    message: 'success',
    data: mockDepts
  });
});

app.get('/api/system/dept/:id', (req, res) => {
  const { id } = req.params;
  
  const mockDept = {
    id: parseInt(id),
    parent_id: 1,
    dept_name: '技术部',
    order_num: 1,
    leader: '李四',
    phone: '13800138001',
    email: 'tech@wedraw.com',
    status: 'active',
    created_at: '2024-01-01 10:00:00',
    updated_at: '2024-01-15 16:30:00'
  };
  
  res.json({
    code: 200,
    message: 'success',
    data: mockDept
  });
});

app.post('/api/system/dept', (req, res) => {
  res.json({
    code: 200,
    message: '部门创建成功',
    data: {
      id: Date.now()
    }
  });
});

app.put('/api/system/dept', (req, res) => {
  res.json({
    code: 200,
    message: '部门更新成功'
  });
});

app.delete('/api/system/dept/:id', (req, res) => {
  res.json({
    code: 200,
    message: '部门删除成功'
  });
});

// 系统管理 - 岗位管理接口
app.get('/api/system/post/list', (req, res) => {
  const { page = 1, size = 10, post_name, status } = req.query;
  
  const mockPosts = [
    {
      id: 1,
      post_code: 'CEO',
      post_name: '首席执行官',
      post_sort: 1,
      status: 'active',
      remark: '公司最高管理者',
      created_at: '2024-01-01 10:00:00',
      updated_at: '2024-01-15 16:30:00'
    },
    {
      id: 2,
      post_code: 'CTO',
      post_name: '首席技术官',
      post_sort: 2,
      status: 'active',
      remark: '技术负责人',
      created_at: '2024-01-01 10:00:00',
      updated_at: '2024-01-15 16:30:00'
    },
    {
      id: 3,
      post_code: 'DEV',
      post_name: '开发工程师',
      post_sort: 3,
      status: 'active',
      remark: '软件开发人员',
      created_at: '2024-01-01 10:00:00',
      updated_at: '2024-01-15 16:30:00'
    },
    {
      id: 4,
      post_code: 'TEST',
      post_name: '测试工程师',
      post_sort: 4,
      status: 'active',
      remark: '软件测试人员',
      created_at: '2024-01-01 10:00:00',
      updated_at: '2024-01-15 16:30:00'
    },
    {
      id: 5,
      post_code: 'PM',
      post_name: '产品经理',
      post_sort: 5,
      status: 'inactive',
      remark: '产品规划和管理',
      created_at: '2024-01-01 10:00:00',
      updated_at: '2024-01-15 16:30:00'
    }
  ];
  
  let filteredPosts = mockPosts;
  
  if (post_name) {
    filteredPosts = filteredPosts.filter(post => 
      post.post_name.includes(post_name) || post.post_code.includes(post_name)
    );
  }
  
  if (status) {
    filteredPosts = filteredPosts.filter(post => post.status === status);
  }
  
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + parseInt(size);
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: paginatedPosts,
      total: filteredPosts.length,
      page: parseInt(page),
      size: parseInt(size)
    }
  });
});

app.get('/api/system/post/:id', (req, res) => {
  const { id } = req.params;
  
  const mockPost = {
    id: parseInt(id),
    post_code: 'DEV',
    post_name: '开发工程师',
    post_sort: 3,
    status: 'active',
    remark: '软件开发人员',
    created_at: '2024-01-01 10:00:00',
    updated_at: '2024-01-15 16:30:00'
  };
  
  res.json({
    code: 200,
    message: 'success',
    data: mockPost
  });
});

app.post('/api/system/post', (req, res) => {
  res.json({
    code: 200,
    message: '岗位创建成功',
    data: {
      id: Date.now()
    }
  });
});

app.put('/api/system/post', (req, res) => {
  res.json({
    code: 200,
    message: '岗位更新成功'
  });
});

app.delete('/api/system/post/:id', (req, res) => {
  res.json({
    code: 200,
    message: '岗位删除成功'
  });
});

app.put('/api/system/post/:id/status', (req, res) => {
  res.json({
    code: 200,
    message: '岗位状态更新成功'
  });
});

app.get('/api/system/post/export', (req, res) => {
  res.json({
    code: 200,
    message: '导出任务已创建',
    data: {
      task_id: 'export_' + Date.now(),
      download_url: '/api/download/posts_' + Date.now() + '.xlsx'
    }
  });
});

// 数据分析概览接口
app.get('/api/data-analysis/overview/stats', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      users: { total: 12345, growth: 12.5 },
      orders: { total: 8967, growth: 8.3 },
      messages: { total: 45678, growth: -2.1 },
      revenue: { total: 234567, growth: 15.8 }
    }
  })
})

app.get('/api/data-analysis/overview/visit-trend', (req, res) => {
  const { period = '7d' } = req.query
  const data = period === '7d' 
    ? [820, 932, 901, 934, 1290, 1330, 1320]
    : [1200, 1400, 1100, 1300, 1600, 1800, 1500, 1700, 1900, 2100, 2000, 2200]
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      labels: period === '7d' 
        ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        : ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      values: data
    }
  })
})

app.get('/api/data-analysis/overview/user-distribution', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: [
      { name: '新用户', value: 1048 },
      { name: '活跃用户', value: 735 },
      { name: '沉睡用户', value: 580 },
      { name: '流失用户', value: 484 }
    ]
  })
})

app.get('/api/data-analysis/overview/popular-features', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: [
      { name: '用户管理', count: 1234, percentage: 85 },
      { name: '订单管理', count: 987, percentage: 68 },
      { name: '商品管理', count: 756, percentage: 52 },
      { name: '数据分析', count: 543, percentage: 37 },
      { name: '系统设置', count: 321, percentage: 22 }
    ]
  })
})

app.get('/api/data-analysis/overview/realtime', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      onlineUsers: 1234,
      todayVisits: 5678,
      todayOrders: 89,
      todayRevenue: 12345
    }
  })
})

app.get('/api/data-analysis/overview/system-status', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: [
      { name: 'CPU使用率', status: '正常', value: '45%', level: 'success' },
      { name: '内存使用率', status: '正常', value: '62%', level: 'success' },
      { name: '磁盘使用率', status: '警告', value: '85%', level: 'warning' },
      { name: '网络状态', status: '正常', value: '良好', level: 'success' }
    ]
  })
})

// 数据分析报表管理接口
app.get('/api/data-analysis/reports', (req, res) => {
  const { page = 1, size = 20, name, type, status } = req.query
  let reports = [
    {
      id: 1,
      name: '用户增长报表',
      type: 'user',
      description: '统计用户注册和活跃情况',
      dataSource: 'users',
      schedule: '每日 09:00',
      lastGenerated: '2024-01-15 09:00:00',
      lastStatus: 'success',
      status: 'active',
      createdAt: '2024-01-10 10:30:00'
    },
    {
      id: 2,
      name: '订单销售报表',
      type: 'order',
      description: '统计订单销售数据和趋势',
      dataSource: 'orders',
      schedule: '每周一 08:00',
      lastGenerated: '2024-01-14 08:00:00',
      lastStatus: 'success',
      status: 'active',
      createdAt: '2024-01-08 14:20:00'
    },
    {
      id: 3,
      name: '财务收支报表',
      type: 'finance',
      description: '统计收入支出和利润情况',
      dataSource: 'finance',
      schedule: null,
      lastGenerated: null,
      lastStatus: null,
      status: 'draft',
      createdAt: '2024-01-12 16:45:00'
    }
  ]
  
  // 筛选
  if (name) reports = reports.filter(r => r.name.includes(name))
  if (type) reports = reports.filter(r => r.type === type)
  if (status) reports = reports.filter(r => r.status === status)
  
  const total = reports.length
  const start = (page - 1) * size
  const list = reports.slice(start, start + parseInt(size))
  
  res.json({
    code: 200,
    message: 'success',
    data: { list, total }
  })
})

app.get('/api/data-analysis/reports/:id', (req, res) => {
  const report = {
    id: parseInt(req.params.id),
    name: '用户增长报表',
    type: 'user',
    description: '统计用户注册和活跃情况',
    dataSource: 'users',
    fields: ['id', 'name', 'email', 'createdAt', 'status'],
    scheduleType: 'daily',
    formats: ['excel', 'pdf'],
    status: 'active'
  }
  res.json({ code: 200, message: 'success', data: report })
})

app.post('/api/data-analysis/reports', (req, res) => {
  res.json({ code: 200, message: '报表创建成功' })
})

app.put('/api/data-analysis/reports/:id', (req, res) => {
  res.json({ code: 200, message: '报表更新成功' })
})

app.delete('/api/data-analysis/reports/:id', (req, res) => {
  res.json({ code: 200, message: '报表删除成功' })
})

app.patch('/api/data-analysis/reports/:id/status', (req, res) => {
  res.json({ code: 200, message: '状态更新成功' })
})

app.post('/api/data-analysis/reports/batch-delete', (req, res) => {
  res.json({ code: 200, message: '批量删除成功' })
})

app.get('/api/data-analysis/reports/export', (req, res) => {
  res.json({ code: 200, message: '导出成功' })
})

app.get('/api/data-analysis/reports/stats', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      total: 25,
      active: 18,
      scheduled: 12,
      generated: 8
    }
  })
})

app.post('/api/data-analysis/reports/:id/generate', (req, res) => {
  res.json({ code: 200, message: '报表生成成功' })
})

app.get('/api/data-analysis/data-sources', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: [
      { id: 'users', name: '用户数据', type: 'table' },
      { id: 'orders', name: '订单数据', type: 'table' },
      { id: 'products', name: '商品数据', type: 'table' },
      { id: 'finance', name: '财务数据', type: 'table' }
    ]
  })
})

// 消息中心模板管理接口
app.get('/api/message-center/templates', (req, res) => {
  const { page = 1, size = 20, name, type, status, category } = req.query
  let templates = [
    {
      id: 1,
      name: '用户注册欢迎邮件',
      type: 'email',
      category: '用户通知',
      subject: '欢迎加入WeDraw',
      content: '亲爱的{{name}}，欢迎您注册WeDraw账户！',
      variables: 'name-用户姓名，email-邮箱地址',
      status: 'active',
      isDefault: true,
      usageCount: 156,
      updatedAt: '2024-01-15 10:30:00',
      remark: '用户注册成功后发送的欢迎邮件'
    },
    {
      id: 2,
      name: '密码重置短信',
      type: 'sms',
      category: '安全通知',
      subject: '密码重置验证码',
      content: '您的密码重置验证码是：{{code}}，5分钟内有效。',
      variables: 'code-验证码，phone-手机号',
      status: 'active',
      isDefault: false,
      usageCount: 89,
      updatedAt: '2024-01-14 16:20:00',
      remark: '用户申请密码重置时发送验证码'
    }
  ]
  
  // 筛选
  if (name) templates = templates.filter(t => t.name.includes(name))
  if (type) templates = templates.filter(t => t.type === type)
  if (status) templates = templates.filter(t => t.status === status)
  if (category) templates = templates.filter(t => t.category === category)
  
  const total = templates.length
  const start = (page - 1) * size
  const list = templates.slice(start, start + parseInt(size))
  
  res.json({
    code: 200,
    message: 'success',
    data: { list, total }
  })
})

app.get('/api/message-center/templates/:id', (req, res) => {
  const template = {
    id: parseInt(req.params.id),
    name: '用户注册欢迎邮件',
    type: 'email',
    category: '用户通知',
    subject: '欢迎加入WeDraw',
    content: '亲爱的{{name}}，欢迎您注册WeDraw账户！您的邮箱是{{email}}。',
    variables: 'name-用户姓名，email-邮箱地址',
    status: 'active',
    remark: '用户注册成功后发送的欢迎邮件'
  }
  res.json({ code: 200, message: 'success', data: template })
})

app.post('/api/message-center/templates', (req, res) => {
  res.json({ code: 200, message: '模板创建成功' })
})

app.put('/api/message-center/templates/:id', (req, res) => {
  res.json({ code: 200, message: '模板更新成功' })
})

app.delete('/api/message-center/templates/:id', (req, res) => {
  res.json({ code: 200, message: '模板删除成功' })
})

app.patch('/api/message-center/templates/:id/status', (req, res) => {
  res.json({ code: 200, message: '状态更新成功' })
})

app.post('/api/message-center/templates/batch-delete', (req, res) => {
  res.json({ code: 200, message: '批量删除成功' })
})

app.get('/api/message-center/templates/export', (req, res) => {
  res.json({ code: 200, message: '导出成功' })
})

app.get('/api/message-center/templates/stats', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      total: 25,
      active: 18,
      used: 12,
      categories: 6
    }
  })
})

app.get('/api/message-center/template-categories', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: [
      { id: 1, name: '用户通知' },
      { id: 2, name: '安全通知' },
      { id: 3, name: '营销推广' },
      { id: 4, name: '系统通知' }
    ]
  })
})

// 消息中心发送记录接口
app.get('/api/message-center/records', (req, res) => {
  const { page = 1, size = 20, type, status, templateId, recipient } = req.query
  let records = [
    {
      id: 'MSG001',
      type: 'email',
      templateName: '用户注册欢迎邮件',
      subject: '欢迎加入WeDraw',
      recipient: 'user@example.com',
      sender: 'system@wedraw.com',
      status: 'success',
      sentAt: '2024-01-15 10:30:00',
      deliveredAt: '2024-01-15 10:30:15'
    },
    {
      id: 'MSG002',
      type: 'sms',
      templateName: '密码重置短信',
      subject: '密码重置验证码',
      recipient: '138****8888',
      sender: 'system',
      status: 'failed',
      sentAt: '2024-01-15 09:45:00',
      deliveredAt: null,
      error: '手机号码格式错误'
    }
  ]
  
  // 筛选
  if (type) records = records.filter(r => r.type === type)
  if (status) records = records.filter(r => r.status === status)
  if (recipient) records = records.filter(r => r.recipient.includes(recipient))
  
  const total = records.length
  const start = (page - 1) * size
  const list = records.slice(start, start + parseInt(size))
  
  res.json({
    code: 200,
    message: 'success',
    data: { list, total }
  })
})

app.get('/api/message-center/records/:id', (req, res) => {
  const record = {
    id: req.params.id,
    type: 'email',
    templateName: '用户注册欢迎邮件',
    subject: '欢迎加入WeDraw',
    recipient: 'user@example.com',
    sender: 'system@wedraw.com',
    status: 'success',
    sentAt: '2024-01-15 10:30:00',
    deliveredAt: '2024-01-15 10:30:15',
    content: '<p>亲爱的张三，欢迎您注册WeDraw账户！</p>',
    logs: [
      {
        id: 1,
        level: 'info',
        message: '开始发送邮件',
        createdAt: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        level: 'success',
        message: '邮件发送成功',
        createdAt: '2024-01-15 10:30:15'
      }
    ]
  }
  res.json({ code: 200, message: 'success', data: record })
})

app.delete('/api/message-center/records/:id', (req, res) => {
  res.json({ code: 200, message: '记录删除成功' })
})

app.post('/api/message-center/records/batch-delete', (req, res) => {
  res.json({ code: 200, message: '批量删除成功' })
})

app.post('/api/message-center/records/:id/resend', (req, res) => {
  res.json({ code: 200, message: '重发成功' })
})

app.post('/api/message-center/records/batch-resend', (req, res) => {
  res.json({ code: 200, message: '批量重发成功' })
})

app.get('/api/message-center/records/export', (req, res) => {
  res.json({ code: 200, message: '导出成功' })
})

app.get('/api/message-center/records/stats', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      total: 1250,
      success: 1180,
      failed: 45,
      pending: 25
    }
  })
})

app.post('/api/message-center/messages/send', (req, res) => {
  res.json({ code: 200, message: '消息发送成功' })
})

// 企业微信机器人管理接口
app.get('/api/wecom/robots', (req, res) => {
  const { page = 1, limit = 20, name, groupName, status } = req.query
  
  let robots = [
    {
      id: 'robot001',
      name: '技术通知机器人',
      webhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc123',
      groupId: 'group001',
      groupName: '技术交流群',
      description: '用于发送技术相关通知和公告',
      status: 1,
      messageCount: 156,
      lastMessageTime: '2024-01-20 15:30:00',
      createTime: '2024-01-15 10:00:00'
    },
    {
      id: 'robot002',
      name: '项目进度机器人',
      webhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=def456',
      groupId: 'group003',
      groupName: '项目协作群',
      description: '自动推送项目进度和里程碑',
      status: 1,
      messageCount: 89,
      lastMessageTime: '2024-01-20 14:15:00',
      createTime: '2024-01-12 14:30:00'
    },
    {
      id: 'robot003',
      name: '监控告警机器人',
      webhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=ghi789',
      groupId: 'group001',
      groupName: '技术交流群',
      description: '系统监控告警推送',
      status: 0,
      messageCount: 234,
      lastMessageTime: '2024-01-19 22:45:00',
      createTime: '2024-01-08 09:15:00'
    }
  ]
  
  // 过滤
  if (name) {
    robots = robots.filter(robot => robot.name.includes(name))
  }
  if (groupName) {
    robots = robots.filter(robot => robot.groupName.includes(groupName))
  }
  if (status !== undefined) {
    robots = robots.filter(robot => robot.status == status)
  }
  
  const total = robots.length
  const start = (page - 1) * limit
  const end = start + parseInt(limit)
  const paginatedRobots = robots.slice(start, end)
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      robots: paginatedRobots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    }
  })
})

app.get('/api/wecom/robots/:id', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: req.params.id,
      name: '技术通知机器人',
      webhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc123',
      groupId: 'group001',
      groupName: '技术交流群',
      description: '用于发送技术相关通知和公告',
      status: 1,
      messageCount: 156,
      lastMessageTime: '2024-01-20 15:30:00',
      createTime: '2024-01-15 10:00:00'
    }
  })
})

app.post('/api/wecom/robots', (req, res) => {
  res.json({
    code: 200,
    message: '机器人创建成功',
    data: {
      id: 'robot' + Date.now()
    }
  })
})

app.put('/api/wecom/robots/:id', (req, res) => {
  res.json({
    code: 200,
    message: '机器人更新成功'
  })
})

app.delete('/api/wecom/robots/:id', (req, res) => {
  res.json({
    code: 200,
    message: '机器人删除成功'
  })
})

app.put('/api/wecom/robots/:id/status', (req, res) => {
  res.json({
    code: 200,
    message: '状态更新成功'
  })
})

app.post('/api/wecom/robots/:id/test', (req, res) => {
  res.json({
    code: 200,
    message: '测试消息发送成功'
  })
})

app.post('/api/wecom/robots/:id/send', (req, res) => {
  res.json({
    code: 200,
    message: '消息发送成功'
  })
})

app.get('/api/wecom/robot-messages', (req, res) => {
  const { page = 1, limit = 20, robotId } = req.query
  
  const messages = [
    {
      id: 'msg001',
      robotId: robotId || 'robot001',
      content: '系统部署完成，请及时验证功能',
      msgtype: 'text',
      status: 'success',
      sendTime: '2024-01-20 15:30:00',
      errorMsg: null
    },
    {
      id: 'msg002',
      robotId: robotId || 'robot001',
      content: '# 项目进度更新\n\n本周完成功能：\n- 用户管理模块\n- 权限控制',
      msgtype: 'markdown',
      status: 'success',
      sendTime: '2024-01-20 14:15:00',
      errorMsg: null
    },
    {
      id: 'msg003',
      robotId: robotId || 'robot001',
      content: '服务器CPU使用率过高，请及时处理',
      msgtype: 'text',
      status: 'failed',
      sendTime: '2024-01-20 13:45:00',
      errorMsg: 'webhook地址无效'
    }
  ]
  
  const total = messages.length
  const start = (page - 1) * limit
  const end = start + parseInt(limit)
  const paginatedMessages = messages.slice(start, end)
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      messages: paginatedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    }
  })
})

app.post('/api/wecom/robots/sync', (req, res) => {
  res.json({
    code: 200,
    message: '同步成功',
    data: {
      syncCount: 8,
      activeCount: 6,
      inactiveCount: 2
    }
  })
})

app.get('/api/wecom/robots/statistics', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      total: 8,
      active: 6,
      todayMessages: 45,
      successRate: '96.8%'
    }
  })
})

app.delete('/api/wecom/robots/batch', (req, res) => {
  res.json({
    code: 200,
    message: '批量删除成功'
  })
})

app.get('/api/wecom/robots/export', (req, res) => {
  res.json({
    code: 200,
    message: '导出成功',
    data: {
      downloadUrl: '/downloads/robots.xlsx'
    }
  })
})

app.get('/api/wecom/robot-templates', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      templates: [
        {
          id: 'template001',
          name: '系统通知模板',
          description: '用于系统通知的标准模板',
          config: {
            msgtype: 'text',
            format: '【系统通知】{content}'
          }
        },
        {
          id: 'template002',
          name: '告警通知模板',
          description: '用于告警通知的模板',
          config: {
            msgtype: 'markdown',
            format: '# 🚨 告警通知\n\n**告警内容：**{content}\n\n**时间：**{time}'
          }
        }
      ]
    }
  })
})

app.post('/api/wecom/robot-templates', (req, res) => {
  res.json({
    code: 200,
    message: '模板创建成功'
  })
})

app.post('/api/wecom/robots/:id/apply-template', (req, res) => {
  res.json({
    code: 200,
    message: '模板应用成功'
  })
})

app.get('/api/wecom/robots/:id/send-stats', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      totalSent: 156,
      successCount: 151,
      failedCount: 5,
      successRate: '96.8%',
      dailyStats: [
        { date: '2024-01-20', sent: 12, success: 12, failed: 0 },
        { date: '2024-01-19', sent: 8, success: 7, failed: 1 },
        { date: '2024-01-18', sent: 15, success: 14, failed: 1 }
      ]
    }
  })
})

app.post('/api/wecom/robots/:id/reset-webhook', (req, res) => {
  res.json({
    code: 200,
    message: 'Webhook重置成功',
    data: {
      newWebhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=new' + Date.now()
    }
  })
})

// 通用404处理
app.use((req, res) => {
  console.log(`Mock API called: ${req.method} ${req.originalUrl}`);
  res.json(mockResponse({}, `Mock response for ${req.originalUrl}`));
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /api/wechat-official/api/fans');
  console.log('- GET /api/wechat-official/api/tags');
  console.log('Press Ctrl+C to stop the server');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down mock server...');
  server.close(() => {
    console.log('Mock server stopped');
    process.exit(0);
  });
});

module.exports = app;