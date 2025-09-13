# WeDraw 项目目录结构

## 整体架构
```
WeDraw/
├── README.md                    # 项目文档
├── .gitignore                   # Git忽略文件
├── package.json                 # 根项目配置
├── project-structure.md         # 项目结构说明
├── docker-compose.yml           # Docker编排文件（可选）
├── nginx/                       # Nginx配置
│   ├── nginx.conf              # 主配置文件
│   ├── api-gateway.conf        # API网关配置
│   └── static-sites.conf       # 静态站点配置
├── docs/                        # 项目文档
│   ├── api/                    # API文档
│   ├── deployment/             # 部署文档
│   └── development/            # 开发文档
├── scripts/                     # 部署和构建脚本
│   ├── deploy.sh               # 部署脚本
│   ├── build-all.sh            # 全量构建脚本
│   └── start-services.sh       # 服务启动脚本
├── backend/                     # 后端微服务
│   ├── api-gateway/            # API网关服务 (端口: 3000)
│   ├── user-center/            # 用户中心服务 (端口: 3001)
│   ├── wechat-official/        # 公众号服务 (端口: 3002)
│   ├── wecom-service/          # 企业微信服务 (端口: 3003)
│   ├── miniprogram-service/    # 小程序服务 (端口: 3004)
│   ├── points-mall/            # 积分商城服务 (端口: 3005)
│   ├── message-center/         # 消息中心服务 (端口: 3006)
│   ├── data-analysis/          # 数据分析服务 (端口: 3007)
│   └── shared/                 # 共享模块
│       ├── utils/              # 工具函数
│       ├── middleware/         # 中间件
│       ├── models/             # 数据模型
│       └── config/             # 配置文件
└── frontend/                    # 前端应用
    ├── admin/                  # 管理后台 (Vue3 + Element Plus)
    ├── miniprogram/            # 小程序前端 (UniApp)
    ├── wechat-h5/              # 公众号H5 (Vue3 + Vant)
    ├── wecom-h5/               # 企业微信H5 (Vue3 + Vant)
    ├── points-h5/              # 积分商城H5 (Vue3 + Vant)
    └── shared/                 # 前端共享组件
        ├── components/         # 通用组件
        ├── utils/              # 工具函数
        └── styles/             # 通用样式
```

## 端口分配
- API网关: 3000 (统一入口)
- 用户中心: 3001
- 公众号服务: 3002
- 企业微信服务: 3003
- 小程序服务: 3004
- 积分商城服务: 3005
- 消息中心服务: 3006
- 数据分析服务: 3007

## API路由规范
- 用户中心: `/api/user/*`
- 公众号: `/api/wechat/*`
- 企业微信: `/api/wecom/*`
- 小程序: `/api/miniprogram/*`
- 积分商城: `/api/points/*`
- 消息中心: `/api/message/*`
- 数据分析: `/api/analytics/*`

## 数据库命名规范
- 用户中心: `wedraw_user_center`
- 公众号: `wedraw_wechat_official`
- 企业微信: `wedraw_wecom`
- 小程序: `wedraw_miniprogram`
- 积分商城: `wedraw_points_mall`
- 消息中心: `wedraw_message_center`
- 数据分析: `wedraw_data_analysis`

## Redis实例分配
- API网关: Redis DB 0 (端口: 6379)
- 用户中心: Redis DB 1 (端口: 6379)
- 公众号: Redis DB 2 (端口: 6379)
- 企业微信: Redis DB 3 (端口: 6379)
- 小程序: Redis DB 4 (端口: 6379)
- 积分商城: Redis DB 5 (端口: 6379)
- 消息中心: Redis DB 6 (端口: 6379)
- 数据分析: Redis DB 7 (端口: 6379)