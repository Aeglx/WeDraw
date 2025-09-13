const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    charset: config.database.charset,
    collate: config.database.collate,
    timezone: config.database.timezone,
    pool: config.database.pool,
    logging: config.database.logging,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
    hooks: {
      beforeConnect: () => {
        logger.info('Connecting to database...');
      },
      afterConnect: () => {
        logger.info('Database connected successfully');
      },
      beforeDisconnect: () => {
        logger.info('Disconnecting from database...');
      },
      afterDisconnect: () => {
        logger.info('Database disconnected');
      },
    },
  }
);

// 导入模型
const Fan = require('./Fan')(sequelize, Sequelize.DataTypes);
const Message = require('./Message')(sequelize, Sequelize.DataTypes);
const Menu = require('./Menu')(sequelize, Sequelize.DataTypes);
const Material = require('./Material')(sequelize, Sequelize.DataTypes);
const Template = require('./Template')(sequelize, Sequelize.DataTypes);
const MessageLog = require('./MessageLog')(sequelize, Sequelize.DataTypes);
const FanTag = require('./FanTag')(sequelize, Sequelize.DataTypes);
const AutoReply = require('./AutoReply')(sequelize, Sequelize.DataTypes);
const QRCode = require('./QRCode')(sequelize, Sequelize.DataTypes);
const Statistics = require('./Statistics')(sequelize, Sequelize.DataTypes);

// 定义关联关系

// 粉丝和标签的多对多关系
Fan.belongsToMany(FanTag, {
  through: 'fan_tag_relations',
  foreignKey: 'fan_id',
  otherKey: 'tag_id',
  as: 'tags',
});

FanTag.belongsToMany(Fan, {
  through: 'fan_tag_relations',
  foreignKey: 'tag_id',
  otherKey: 'fan_id',
  as: 'fans',
});

// 粉丝和消息的关系
Fan.hasMany(Message, {
  foreignKey: 'fan_id',
  as: 'messages',
});

Message.belongsTo(Fan, {
  foreignKey: 'fan_id',
  as: 'fan',
});

// 粉丝和消息日志的关系
Fan.hasMany(MessageLog, {
  foreignKey: 'fan_id',
  as: 'messageLogs',
});

MessageLog.belongsTo(Fan, {
  foreignKey: 'fan_id',
  as: 'fan',
});

// 模板和消息日志的关系
Template.hasMany(MessageLog, {
  foreignKey: 'template_id',
  as: 'messageLogs',
});

MessageLog.belongsTo(Template, {
  foreignKey: 'template_id',
  as: 'template',
});

// 素材和消息的关系
Material.hasMany(Message, {
  foreignKey: 'material_id',
  as: 'messages',
});

Message.belongsTo(Material, {
  foreignKey: 'material_id',
  as: 'material',
});

// 二维码和粉丝的关系
QRCode.hasMany(Fan, {
  foreignKey: 'qr_scene',
  sourceKey: 'scene_str',
  as: 'fans',
});

Fan.belongsTo(QRCode, {
  foreignKey: 'qr_scene',
  targetKey: 'scene_str',
  as: 'qrCode',
});

// 菜单的层级关系
Menu.hasMany(Menu, {
  foreignKey: 'parent_id',
  as: 'children',
});

Menu.belongsTo(Menu, {
  foreignKey: 'parent_id',
  as: 'parent',
});

// 数据库连接测试
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    return false;
  }
}

// 同步数据库
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    logger.info('Database synchronized successfully.');
    return true;
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    return false;
  }
}

// 关闭数据库连接
async function closeConnection() {
  try {
    await sequelize.close();
    logger.info('Database connection closed.');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
}

// 数据库健康检查
async function healthCheck() {
  try {
    await sequelize.authenticate();
    return {
      status: 'healthy',
      message: 'Database connection is working',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database connection failed: ${error.message}`,
    };
  }
}

// 获取数据库统计信息
async function getDatabaseStats() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        table_name,
        table_rows,
        data_length,
        index_length,
        (data_length + index_length) as total_size
      FROM information_schema.tables 
      WHERE table_schema = :database
      ORDER BY total_size DESC
    `, {
      replacements: { database: config.database.database },
    });
    
    return results;
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return [];
  }
}

// 执行原始查询
async function query(sql, options = {}) {
  try {
    const startTime = Date.now();
    const result = await sequelize.query(sql, options);
    const duration = Date.now() - startTime;
    
    logger.database(sql, duration);
    return result;
  } catch (error) {
    logger.database(sql, 0, error);
    throw error;
  }
}

// 开始事务
async function transaction(callback) {
  const t = await sequelize.transaction();
  
  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

module.exports = {
  sequelize,
  Sequelize,
  
  // 模型
  Fan,
  Message,
  Menu,
  Material,
  Template,
  MessageLog,
  FanTag,
  AutoReply,
  QRCode,
  Statistics,
  
  // 工具函数
  testConnection,
  syncDatabase,
  closeConnection,
  healthCheck,
  getDatabaseStats,
  query,
  transaction,
};