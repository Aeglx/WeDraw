module.exports = {
  apps: [
    {
      name: 'wedraw-api-gateway',
      script: './backend/api-gateway/server.js',
      cwd: './backend/api-gateway',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/api-gateway-error.log',
      out_file: './logs/api-gateway-out.log',
      log_file: './logs/api-gateway-combined.log',
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512'
    },
    {
      name: 'wedraw-user-center',
      script: './backend/user-center/server.js',
      cwd: './backend/user-center',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/user-center-error.log',
      out_file: './logs/user-center-out.log',
      log_file: './logs/user-center-combined.log',
      time: true,
      max_memory_restart: '300M',
      node_args: '--max-old-space-size=256'
    },
    {
      name: 'wedraw-official',
      script: './backend/official/server.js',
      cwd: './backend/official',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/official-error.log',
      out_file: './logs/official-out.log',
      log_file: './logs/official-combined.log',
      time: true,
      max_memory_restart: '300M',
      node_args: '--max-old-space-size=256'
    },
    {
      name: 'wedraw-wecom',
      script: './backend/wecom/server.js',
      cwd: './backend/wecom',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3003
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      error_file: './logs/wecom-error.log',
      out_file: './logs/wecom-out.log',
      log_file: './logs/wecom-combined.log',
      time: true,
      max_memory_restart: '300M',
      node_args: '--max-old-space-size=256'
    },
    {
      name: 'wedraw-miniprogram',
      script: './backend/miniprogram/server.js',
      cwd: './backend/miniprogram',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3004
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      error_file: './logs/miniprogram-error.log',
      out_file: './logs/miniprogram-out.log',
      log_file: './logs/miniprogram-combined.log',
      time: true,
      max_memory_restart: '300M',
      node_args: '--max-old-space-size=256'
    },
    {
      name: 'wedraw-points',
      script: './backend/points/server.js',
      cwd: './backend/points',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3005
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      error_file: './logs/points-error.log',
      out_file: './logs/points-out.log',
      log_file: './logs/points-combined.log',
      time: true,
      max_memory_restart: '300M',
      node_args: '--max-old-space-size=256'
    },
    {
      name: 'wedraw-message',
      script: './backend/message/server.js',
      cwd: './backend/message',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3006
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      error_file: './logs/message-error.log',
      out_file: './logs/message-out.log',
      log_file: './logs/message-combined.log',
      time: true,
      max_memory_restart: '300M',
      node_args: '--max-old-space-size=256'
    },
    {
      name: 'wedraw-analysis',
      script: './backend/analysis/server.js',
      cwd: './backend/analysis',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3007
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3007
      },
      error_file: './logs/analysis-error.log',
      out_file: './logs/analysis-out.log',
      log_file: './logs/analysis-combined.log',
      time: true,
      max_memory_restart: '300M',
      node_args: '--max-old-space-size=256'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/WeDraw.git',
      path: '/var/www/wedraw',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'deploy',
      host: ['your-staging-server-ip'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/WeDraw.git',
      path: '/var/www/wedraw-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};

// PM2 常用命令:
// pm2 start ecosystem.config.js                    # 启动所有应用
// pm2 start ecosystem.config.js --env production   # 以生产环境启动
// pm2 reload ecosystem.config.js                   # 重载所有应用
// pm2 stop ecosystem.config.js                     # 停止所有应用
// pm2 delete ecosystem.config.js                   # 删除所有应用
// pm2 logs                                          # 查看所有日志
// pm2 logs wedraw-api-gateway                       # 查看特定应用日志
// pm2 monit                                         # 监控面板
// pm2 status                                        # 查看状态