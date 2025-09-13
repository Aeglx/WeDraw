/**
 * 模型索引文件
 */

const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// 导入模型
const initUser = require('./User');
const initMessage = require('./Message');
const initSession = require('./Session');

// 初始化模型
const User = initUser(sequelize);
const Message = initMessage(sequelize);
const Session = initSession(sequelize);

// 定义模型关联关系

// 用户与消息的关联
User.hasMany(Message, {
  foreignKey: 'sender_id',
  as: 'sentMessages',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

User.hasMany(Message, {
  foreignKey: 'receiver_id',
  as: 'receivedMessages',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Message.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

Message.belongsTo(User, {
  foreignKey: 'receiver_id',
  as: 'receiver',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 用户与会话的关联
User.hasMany(Session, {
  foreignKey: 'user_id',
  as: 'sessions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Session.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 导出模型和Sequelize实例
module.exports = {
  sequelize,
  Sequelize,
  User,
  Message,
  Session,
  
  // 数据库连接方法
  async connect() {
    try {
      await sequelize.authenticate();
      console.log('✅ 数据库连接成功');
      return true;
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      throw error;
    }
  },
  
  // 数据库同步方法
  async sync(options = {}) {
    try {
      const { force = false, alter = false } = options;
      await sequelize.sync({ force, alter });
      console.log('✅ 数据库同步成功');
      return true;
    } catch (error) {
      console.error('❌ 数据库同步失败:', error.message);
      throw error;
    }
  },
  
  // 关闭数据库连接
  async close() {
    try {
      await sequelize.close();
      console.log('✅ 数据库连接已关闭');
      return true;
    } catch (error) {
      console.error('❌ 关闭数据库连接失败:', error.message);
      throw error;
    }
  },
  
  // 检查数据库连接状态
  async checkConnection() {
    try {
      await sequelize.authenticate();
      return {
        status: 'connected',
        database: dbConfig.database,
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message
      };
    }
  },
  
  // 获取数据库统计信息
  async getStats() {
    try {
      const userCount = await User.count();
      const messageCount = await Message.count();
      const sessionCount = await Session.count({ where: { status: 'active' } });
      
      return {
        users: userCount,
        messages: messageCount,
        active_sessions: sessionCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取数据库统计信息失败:', error.message);
      throw error;
    }
  },
  
  // 执行原始SQL查询
  async query(sql, options = {}) {
    try {
      const [results, metadata] = await sequelize.query(sql, {
        type: Sequelize.QueryTypes.SELECT,
        ...options
      });
      return results;
    } catch (error) {
      console.error('执行SQL查询失败:', error.message);
      throw error;
    }
  },
  
  // 开始事务
  async transaction(callback) {
    const t = await sequelize.transaction();
    try {
      const result = await callback(t);
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
  
  // 批量操作
  async bulkOperations() {
    return {
      // 批量创建用户
      createUsers: async (users) => {
        return User.bulkCreate(users, {
          validate: true,
          ignoreDuplicates: true
        });
      },
      
      // 批量创建消息
      createMessages: async (messages) => {
        return Message.bulkCreate(messages, {
          validate: true
        });
      },
      
      // 批量更新用户状态
      updateUserStatus: async (userIds, status) => {
        return User.update(
          { status },
          {
            where: {
              id: {
                [Sequelize.Op.in]: userIds
              }
            }
          }
        );
      },
      
      // 批量删除过期会话
      deleteExpiredSessions: async (days = 30) => {
        const expireDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return Session.destroy({
          where: {
            status: 'expired',
            expired_at: {
              [Sequelize.Op.lt]: expireDate
            }
          }
        });
      }
    };
  },
  
  // 数据库维护
  async maintenance() {
    return {
      // 清理过期数据
      cleanExpiredData: async () => {
        const results = {};
        
        // 清理过期会话
        results.expiredSessions = await Session.cleanExpiredSessions();
        
        // 清理过期消息
        results.expiredMessages = await Message.cleanExpiredMessages(30);
        
        // 删除过期会话记录
        results.deletedSessions = await Session.deleteExpiredSessions(30);
        
        return results;
      },
      
      // 优化数据库表
      optimizeTables: async () => {
        const tables = ['users', 'messages', 'sessions'];
        const results = {};
        
        for (const table of tables) {
          try {
            await sequelize.query(`OPTIMIZE TABLE ${table}`);
            results[table] = 'optimized';
          } catch (error) {
            results[table] = `error: ${error.message}`;
          }
        }
        
        return results;
      },
      
      // 分析表统计信息
      analyzeTableStats: async () => {
        const stats = {};
        
        try {
          const userStats = await sequelize.query(
            'SELECT COUNT(*) as total, COUNT(CASE WHEN status = "active" THEN 1 END) as active FROM users',
            { type: Sequelize.QueryTypes.SELECT }
          );
          stats.users = userStats[0];
          
          const messageStats = await sequelize.query(
            'SELECT COUNT(*) as total, COUNT(CASE WHEN status = "sent" THEN 1 END) as sent FROM messages',
            { type: Sequelize.QueryTypes.SELECT }
          );
          stats.messages = messageStats[0];
          
          const sessionStats = await sequelize.query(
            'SELECT COUNT(*) as total, COUNT(CASE WHEN status = "active" THEN 1 END) as active FROM sessions',
            { type: Sequelize.QueryTypes.SELECT }
          );
          stats.sessions = sessionStats[0];
          
        } catch (error) {
          console.error('分析表统计信息失败:', error.message);
        }
        
        return stats;
      }
    };
  }
};