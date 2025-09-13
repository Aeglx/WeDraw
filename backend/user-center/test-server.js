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

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Test User Center Service started on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Role API: http://localhost:${PORT}/api/user-center/system/role/list`);
});

module.exports = app;