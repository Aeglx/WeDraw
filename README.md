企业微信、公众号、小程序及积分商城管理平台
完整开发文档（非 Docker 部署版）
一、项目概述
1.1 项目背景
随着企业数字化转型加速，企业需通过微信生态（公众号、企业微信、小程序）实现用户管理、客户互动与业务拓展，积分商城作为用户激励核心模块需与微信生态深度协同。本项目采用微服务架构，实现各业务模块独立开发、部署与扩展，同时通过统一入口保障运营效率。
1.2 项目目标
实现公众号、企业微信、小程序、积分商城的独立管理与数据协同
各模块技术解耦，支持单独迭代与资源扩容
建立安全、稳定的非容器化部署体系，降低运维复杂度
提供统一管理后台，满足多角色运营需求
1.3 适用范围
适用于企业市场运营团队、客户服务团队及系统管理员，用于微信生态用户运营、消息推送、数据分析及积分营销活动管理。
二、系统架构设计
2.1 整体架构
采用分层微服务架构，各层职责清晰且独立，架构层次如下：

plaintext
客户端层 → API网关层 → 微服务层 → 数据存储层 → 基础设施层

客户端层：5 个独立前端应用（小程序、公众号 H5、企业微信 H5、积分商城 H5、管理后台）
API 网关层：统一请求入口，处理路由、认证、限流
微服务层：8 个独立后端服务（按业务域拆分）
数据存储层：独立 MySQL 数据库 + 独立 Redis 缓存（按服务拆分）
基础设施层：日志、监控、配置管理、消息队列等支撑组件
2.2 技术栈选型
层级	技术选型
前端核心	Vue 3（Composition API）、Vite、Vue Router 4、Pinia
前端 UI	Element Plus（管理后台）、Vant（移动端 / H5）、UniApp（小程序跨端）
后端运行环境	Node.js 16.x（稳定版）
后端框架	Express（轻量 Web 框架）、Sequelize（MySQL ORM）
数据存储	MySQL 8.0（关系型数据）、Redis 6.x（缓存）
中间件	RabbitMQ 3.9.x（消息队列）、Nginx 1.20.x（反向代理 / 静态资源服务）
认证授权	JWT（无状态 Token）、RBAC（权限模型）
监控日志	Prometheus + Grafana（监控）、Winston（日志）、ELK Stack（日志分析）
部署工具	Jenkins（CI/CD）、Nginx（服务代理）、Supervisor（Node 服务进程管理）
三、前端架构设计
3.1 前端应用拆分（独立部署）
应用名称	功能范围	技术栈	部署方式
管理后台前端	全平台管理入口（各服务配置、数据统计、权限管理）	Vue 3 + Vite + Element Plus	静态资源部署至 Nginx，通过 Nginx 反向代理对接 API 网关
小程序前端	小程序用户端功能（用户中心、业务交互、积分查询）	Vue 3 + UniApp	打包为微信小程序包，提交至微信公众平台审核发布
公众号 H5 前端	公众号自定义菜单页面、粉丝互动页面（需集成微信 JS-SDK）	Vue 3 + Vite + Vant + 微信 JS-SDK	静态资源部署至 Nginx，配置公众号可信域名，通过 Nginx 对接公众号后端服务
企业微信 H5 前端	企业微信应用内页面（通讯录、群聊入口、机器人配置）	Vue 3 + Vite + Vant + 企业微信 JS-SDK	静态资源部署至 Nginx，配置企业微信可信域名，通过 Nginx 对接企业微信后端服务
积分商城 H5 前端	用户积分兑换、商品浏览、订单查询（支持 PC / 移动端自适应）	Vue 3 + Vite + Vant	静态资源部署至 Nginx，独立域名访问，通过 Nginx 对接积分商城后端服务
3.2 前端通用设计规范
权限控制：基于 RBAC 模型，管理后台按角色分配菜单 / 按钮权限，前端路由拦截未授权访问
交互规范：统一加载状态、错误提示、弹窗样式，确保多应用交互一致性
性能优化：路由懒加载、组件按需引入、静态资源 CDN 加速（图片 / JS/CSS）
错误处理：统一 API 错误拦截、日志上报（对接 ELK Stack）、用户友好提示
兼容性：管理后台兼容 Chrome/Firefox 最新版，移动端 H5 兼容微信浏览器 / 主流手机浏览器
四、后端架构设计
4.1 微服务拆分（独立部署 + 独立数据）
服务名称	核心功能	技术栈	独立依赖（数据库 / 缓存）	对外接口方式
API 网关服务	路由转发、统一认证、限流熔断、请求日志、协议转换	Node.js + Express + express-gateway	无（依赖 Redis 存储 Token / 限流数据）	对外暴露统一 API 域名，转发至各微服务
用户中心服务	统一身份认证、系统用户管理、角色权限配置、跨平台用户关联	Node.js + Express + Sequelize	MySQL（用户中心库）+ Redis（用户缓存 / Token）	仅通过 API 网关暴露接口
公众号服务	粉丝管理、模板消息、自定义菜单、自动回复、素材管理	Node.js + Express + Sequelize	MySQL（公众号库）+ Redis（粉丝缓存 / AccessToken）	仅通过 API 网关暴露接口
企业微信服务	内部通讯录、外部群聊、Webhook 机器人、外部联系人管理	Node.js + Express + Sequelize	MySQL（企业微信库）+ Redis（通讯录缓存）	仅通过 API 网关暴露接口
小程序服务	小程序用户管理、模板消息、基础配置、用户行为统计	Node.js + Express + Sequelize	MySQL（小程序库）+ Redis（用户缓存）	仅通过 API 网关暴露接口
积分商城服务	积分规则、商品管理、兑换订单、积分变动记录	Node.js + Express + Sequelize	MySQL（积分商城库）+ Redis（商品缓存 / 积分）	仅通过 API 网关暴露接口
消息中心服务	多渠道消息模板、消息发送调度、发送记录统计（对接各服务消息需求）	Node.js + Express + RabbitMQ	MySQL（消息中心库）+ Redis（模板缓存）	仅通过 API 网关暴露接口
数据分析服务	各平台数据统计（粉丝增长、订单量、活跃度）、数据可视化报表	Node.js + Express + Sequelize	MySQL（数据分析库）+ Redis（统计结果缓存）	仅通过 API 网关暴露接口
4.2 服务间通信机制
同步通信：基于 RESTful API，通过 API 网关实现服务间调用（适用于实时性要求高的场景，如用户认证）
异步通信：基于 RabbitMQ 消息队列，采用 “发布 - 订阅” 模式（适用于非实时场景，如消息推送、数据同步）
数据一致性：关键业务通过 “事件驱动” 确保最终一致性（如积分变动后同步至消息中心发送通知）
五、数据存储设计
5.1 数据存储原则
独立性：每个微服务对应独立 MySQL 数据库和独立 Redis 实例，避免跨服务数据依赖
性能优化：MySQL 核心表建立索引（如用户 ID、时间戳），大表采用分表策略（如按月份分表存储消息日志）
缓存策略：Redis 缓存高频访问数据（如用户信息、配置参数），设置合理过期时间（会话数据 2 小时、热点数据 15 分钟）
数据安全：敏感数据（如密码）加密存储（采用 BCrypt 算法），数据库定期备份（每日全量 + 增量备份）
5.2 核心数据库表设计（按服务）
服务名称	核心表名	表功能描述
用户中心服务	sys_user（系统用户表）、sys_role（角色表）、sys_permission（权限表）	存储系统操作员账号、角色定义、权限节点，支撑 RBAC 权限模型
公众号服务	official_fans（粉丝表）、official_menu（菜单表）、official_reply（回复表）	存储公众号粉丝信息、自定义菜单配置、自动回复规则
企业微信服务	wecom_department（部门表）、wecom_group（群聊表）、wecom_robot（机器人表）	存储企业微信部门层级、外部群聊信息、Webhook 机器人配置
小程序服务	miniprogram_user（用户表）、miniprogram_config（配置表）	存储小程序用户 openid/unionid、小程序基础配置（如域名、模板 ID）
积分商城服务	points_user（用户积分表）、points_goods（商品表）、points_order（订单表）	存储用户积分余额、商品信息（积分 / 库存）、兑换订单状态
5.3 Redis 缓存设计（按服务）
服务名称	缓存 Key 命名规范	缓存数据类型	过期时间	用途说明
API 网关服务	gateway:rate_limit:{ip}	字符串（计数器）	1 分钟	接口限流，记录 IP 单位时间内请求次数
用户中心服务	user:center:token:{token}	哈希（用户信息）	2 小时	存储 JWT 对应的用户信息，避免重复解析 Token
公众号服务	official:access_token:{appid}	字符串	2 小时（提前 200s 过期）	存储公众号 AccessToken，避免频繁调用微信接口
积分商城服务	points:goods:{goodsId}	哈希（商品信息）	15 分钟	缓存热门商品信息，减少 MySQL 查询压力
六、功能模块详细说明
6.1 公众号管理模块（前端 + 公众号服务）
功能子模块	核心功能点
粉丝管理	1. 粉丝列表（分页 / 筛选：昵称、标签、关注时间）
2. 粉丝详情（基本信息、互动记录、标签）
3. 标签管理（创建 / 编辑 / 删除、批量打标）
4. 粉丝增长统计（日 / 周 / 月趋势图）
消息管理	1. 模板消息（模板选用、单条 / 批量发送、发送记录）
2. 客服消息（实时回复、快捷回复库、会话记录）
3. 消息统计（送达率、点击率）
菜单与回复管理	1. 自定义菜单（可视化编辑、三级菜单、预览 / 发布）
2. 自动回复（关注回复、关键词回复、无匹配回复）
3. 回复内容支持文本 / 图片 / 图文 / 链接
6.2 企业微信管理模块（前端 + 企业微信服务）
功能子模块	核心功能点
内部通讯录管理	1. 部门管理（创建 / 编辑 / 移动、层级调整）
2. 成员管理（添加 / 编辑 / 离职、批量导入）
3. 标签管理（按标签筛选成员、批量打标）
外部群聊管理	1. 群聊列表（筛选：群名称、创建人、成员数）
2. 群成员管理（查看列表、移除成员、设置管理员）
3. 入群欢迎语（自定义文本 / 图片）
4. 群聊统计（活跃度、消息量）
Webhook 机器人管理	1. 机器人列表（创建 / 配置：名称、头像、所属群聊）
2. 消息发送（文本 / 图片 / 链接、发送记录）
3. 权限控制（限制可发送群聊 / 消息类型）
6.3 企业微信管理模块（前端 + 企业微信服务）
功能子模块	核心功能点
内部通讯录管理	1. 部门管理（创建 / 编辑 / 移动、层级调整）
2. 成员管理（添加 / 编辑 / 离职、批量导入）
3. 标签管理（按标签筛选成员、批量打标）
外部群聊管理	1. 群聊列表（筛选：群名称、创建人、成员数）
2. 群成员管理（查看列表、移除成员、设置管理员）
3. 入群欢迎语（自定义文本 / 图片）
4. 群聊统计（活跃度、消息量）
Webhook 机器人管理	1. 机器人列表（创建 / 配置：名称、头像、所属群聊）
2. 消息发送（文本 / 图片 / 链接、发送记录）
3. 权限控制（限制可发送群聊 / 消息类型）
6.4 小程序管理模块（前端 + 小程序服务）
功能子模块	核心功能点
用户管理	1. 小程序用户列表（openid、昵称、头像、关注时间）
2. 用户行为记录（访问页面、操作记录）
消息管理	1. 模板消息配置（选用模板、参数设置）
2. 消息发送（单条 / 批量、发送记录）
3. 订阅消息管理（权限申请、发送统计）
基础配置	1. 服务器域名配置（请求 / 上传 / 下载域名）
2. 业务参数配置（如积分兑换规则关联）
6.5 积分商城管理模块（前端 + 积分商城服务）
功能子模块	核心功能点
积分管理	1. 积分规则设置（获取途径：签到 / 互动；消耗途径：兑换商品）
2. 用户积分查询（余额、变动记录）
3. 积分统计（总发放量、总消耗量）
商品管理	1. 商品列表（添加 / 编辑 / 上下架、分类管理）
2. 商品详情（积分值、库存、兑换限制）
3. 库存管理（手动调整、预警设置）
订单管理	1. 兑换订单列表（筛选：状态、时间、用户）
2. 订单处理（待审核 / 已发货 / 已完成 / 取消）
3. 订单统计（日 / 周 / 月兑换量）
七、非 Docker 部署方案
7.1 部署架构总览
采用物理机 / 虚拟机部署，通过 Nginx 实现反向代理，Supervisor 管理 Node 服务进程，Jenkins 实现 CI/CD 自动化部署，部署架构如下：

plaintext
用户请求 → 负载均衡（Nginx） → 静态资源服务（Nginx）/API网关（Node+Supervisor） → 微服务（Node+Supervisor） → 数据存储（MySQL/Redis）
7.2 服务器规划（推荐配置）
服务器角色	推荐配置（最低要求）	部署组件
负载均衡 / 静态资源服务器	2 核 4G，50GB 存储	Nginx 1.20.x（反向代理 + 静态资源服务）
API 网关服务器	2 核 4G，50GB 存储	Node.js 16.x、Supervisor（管理网关进程）、Redis（存储 Token / 限流数据）
微服务服务器（4 台）	每台 2 核 4G，50GB 存储（按服务拆分部署）	Node.js 16.x、Supervisor（管理微服务进程）、RabbitMQ（消息队列）
MySQL 服务器（主从）	主库：4 核 8G，100GB 存储；从库：2 核 4G，100GB 存储	MySQL 8.0（主从复制，主库写、从库读）
Redis 服务器（多实例）	2 核 4G，50GB 存储	Redis 6.x（按服务创建独立实例，配置密码 + 持久化）
监控 / 日志服务器	2 核 4G，100GB 存储（日志存储需求高）	Prometheus、Grafana、ELK Stack（Elasticsearch+Logstash+Kibana）
CI/CD 服务器	2 核 4G，50GB 存储	Jenkins（自动化构建、部署）
7.3 分模块部署步骤
7.3 分模块部署步骤
7.3.1 基础设施部署（前置条件）
操作系统准备
所有服务器统一安装 CentOS 7.x 或 Ubuntu 20.04 LTS，配置静态 IP、关闭防火墙不必要端口（仅开放 80/443/3306/6379 等必要端口），配置 SSH 密钥登录。
依赖环境安装
所有服务器安装 Node.js 16.x（通过 nvm 管理版本）：
bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 16.18.0 && nvm use 16.18.0

安装 PM2（Node 进程管理）和 Supervisor（服务监控）：
bash
npm install -g pm2
yum install -y supervisor  # CentOS
# 或 apt-get install -y supervisor  # Ubuntu

安装 Nginx、MySQL、Redis、RabbitMQ（按官方文档部署，配置开机自启）。
网络配置
配置 Nginx 反向代理，实现域名与服务的映射（示例配置见 7.4）。
配置 hosts 文件或内部 DNS，确保服务间通过域名 / 主机名通信。
7.3.2 前端应用部署
管理后台 / 公众号 H5 / 企业微信 H5 / 积分商城 H5
前端工程通过npm run build生成静态资源（dist 目录）。
将 dist 目录上传至静态资源服务器的/var/www/{应用名称}目录。
配置 Nginx 指向静态资源目录，并设置缓存策略（CSS/JS 缓存 1 小时，HTML 不缓存）：
nginx
server {
  listen 80;
  server_name admin.example.com;  # 管理后台域名
  root /var/www/admin/dist;
  index index.html;
  
  # 缓存配置
  location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 1h;
    add_header Cache-Control "public, max-age=3600";
  }
  
  # 支持SPA路由
  location / {
    try_files $uri $uri/ /index.html;
  }
}

小程序前端
通过 UniApp 打包生成微信小程序代码包（.zip）。
登录微信公众平台，上传代码包并提交审核，审核通过后发布。
7.3.3 后端服务部署（以 “公众号服务” 为例）
代码部署
通过 Jenkins 从 Git 仓库拉取代码，执行npm install安装依赖。
配置环境变量（数据库连接、API 密钥等），推荐使用.env文件管理：
bash
# 公众号服务环境变量
NODE_ENV=production
DB_HOST=mysql-official.example.com
DB_PORT=3306
DB_USER=official_user
DB_PASS=xxxxxx
REDIS_HOST=redis-official.example.com
REDIS_PORT=6379

服务启动与监控
配置 Supervisor 管理服务进程（/etc/supervisor/conf.d/official-account.conf）：
ini
[program:official-account]
command=/root/.nvm/versions/node/v16.18.0/bin/node /opt/services/official-account/server.js
directory=/opt/services/official-account
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/official-account.log

启动服务并设置开机自启：
bash
supervisorctl reread
supervisorctl update
supervisorctl start official-account

服务验证
访问http://{服务IP}:{端口}/health，返回{"status":"ok"}表示启动成功。
检查日志文件/var/log/official-account.log，确认无报错。
7.3.4 数据库与缓存部署
MySQL 部署
按服务创建独立数据库（如official_account_db、wecom_db），并分配独立账号（仅授予对应库的权限）。
配置主从复制：主库负责写入，从库负责查询，通过mysqldump定期备份数据（每日凌晨执行）。
Redis 部署
为每个服务创建独立 Redis 实例（通过不同端口区分，如 6380 = 公众号服务，6381 = 企业微信服务）。
配置redis.conf：开启密码认证、AOF 持久化，限制最大内存（如 2GB）。
7.4 服务访问流程配置
通过 Nginx 实现 API 网关的反向代理，统一入口为api.example.com，路由规则示例：

nginx
server {
  listen 80;
  server_name api.example.com;
  
  # 公众号服务路由
  location /api/official-account/ {
    proxy_pass http://official-account-service:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
  
  # 企业微信服务路由
  location /api/wecom/ {
    proxy_pass http://wecom-service:3002/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
  
  # 其他服务路由...
  location /api/miniprogram/ { ... }
  location /api/points/ { ... }
}
7.5 监控与运维
服务监控
使用 Prometheus 采集各服务 metrics（通过express-prometheus-middleware暴露指标）。
Grafana 配置仪表盘，监控服务响应时间、错误率、CPU / 内存使用率，设置阈值告警（邮件 / 企业微信通知）。
日志管理
所有服务日志统一输出至/var/log/{服务名}目录，按日期切割（通过 logrotate 配置）。
Logstash 收集日志至 Elasticsearch，通过 Kibana 查询与分析（支持按服务、级别、时间筛选）。
备份策略
MySQL：每日凌晨全量备份（保留 30 天），每小时增量备份（保留 7 天）。
配置文件：通过 Git 管理所有服务的配置文件，确保可追溯。
八、安全设计
接口安全
所有 API 通过 HTTPS 传输（配置 SSL 证书），敏感接口（如登录、支付）额外验证签名。
实现接口限流：单 IP 每分钟最多 60 次请求，防止恶意攻击。
数据安全
数据库敏感字段（如密码）加密存储，API 返回数据过滤敏感信息（如手机号脱敏）。
定期安全审计：检查权限配置、日志异常操作、第三方接口密钥有效期。
访问控制
管理后台仅限企业内网访问，通过 VPN 开放外部临时访问权限。
基于 RBAC 模型严格控制操作权限（如 “只读角色” 无法修改配置）。
九、项目实施计划
阶段	时间周期	核心任务
需求分析	2 周	细化各模块功能点、明确接口规范、输出需求文档
架构设计	1 周	确定技术栈、服务拆分、数据库设计、部署方案
基础开发	4 周	搭建前端框架、后端服务骨架、API 网关、用户中心
业务开发	8 周	按模块并行开发（公众号 / 企业微信 / 小程序 / 积分商城）
测试与优化	3 周	功能测试、性能测试、安全测试、Bug 修复、性能优化
部署与上线	1 周	环境部署、数据迁移、灰度发布、监控配置
运维与迭代	持续	日常运维、问题修复、根据业务需求迭代功能
十、附录
接口文档：通过 Swagger 自动生成，访问http://api.example.com/docs查看。
数据库字典：各服务数据库表结构详情（字段含义、类型、约束）。
常见问题：部署失败排查、服务异常处理、第三方接口对接问题解决方案。
