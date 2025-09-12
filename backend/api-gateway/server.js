import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createProxyMiddleware } from 'http-proxy-middleware'
import dotenv from 'dotenv'
import logger from './src/utils/logger.js'
import authMiddleware from './src/middleware/auth.js'
import errorHandler from './src/middleware/errorHandler.js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.API_GATEWAY_PORT || 3000

// 基础中间件
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 15分钟内最多1000个请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  }
})
app.use(limiter)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 服务路由配置
const services = {
  '/auth': {
    target: `http://localhost:${process.env.USER_CENTER_PORT || 3001}`,
    pathRewrite: { '^/auth': '' },
    requireAuth: false
  },
  '/user': {
    target: `http://localhost:${process.env.USER_CENTER_PORT || 3001}`,
    pathRewrite: { '^/user': '' },
    requireAuth: true
  },
  '/official': {
    target: `http://localhost:${process.env.OFFICIAL_PORT || 3002}`,
    pathRewrite: { '^/official': '' },
    requireAuth: true
  },
  '/wecom': {
    target: `http://localhost:${process.env.WECOM_PORT || 3003}`,
    pathRewrite: { '^/wecom': '' },
    requireAuth: true
  },
  '/miniprogram': {
    target: `http://localhost:${process.env.MINIPROGRAM_PORT || 3004}`,
    pathRewrite: { '^/miniprogram': '' },
    requireAuth: true
  },
  '/points': {
    target: `http://localhost:${process.env.POINTS_PORT || 3005}`,
    pathRewrite: { '^/points': '' },
    requireAuth: true
  },
  '/message': {
    target: `http://localhost:${process.env.MESSAGE_PORT || 3006}`,
    pathRewrite: { '^/message': '' },
    requireAuth: true
  },
  '/analysis': {
    target: `http://localhost:${process.env.ANALYSIS_PORT || 3007}`,
    pathRewrite: { '^/analysis': '' },
    requireAuth: true
  }
}

// 配置代理路由
Object.entries(services).forEach(([path, config]) => {
  const middleware = []
  
  // 添加认证中间件
  if (config.requireAuth) {
    middleware.push(authMiddleware)
  }
  
  // 添加代理中间件
  middleware.push(
    createProxyMiddleware({
      target: config.target,
      changeOrigin: true,
      pathRewrite: config.pathRewrite,
      onError: (err, req, res) => {
        logger.error(`Proxy error for ${path}:`, err.message)
        res.status(503).json({
          code: 503,
          message: '服务暂时不可用',
          error: err.message
        })
      },
      onProxyReq: (proxyReq, req, res) => {
        logger.info(`Proxying ${req.method} ${req.url} to ${config.target}`)
      }
    })
  )
  
  app.use(path, ...middleware)
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    path: req.originalUrl
  })
})

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`)
  logger.info('Service routes configured:')
  Object.entries(services).forEach(([path, config]) => {
    logger.info(`  ${path} -> ${config.target} (Auth: ${config.requireAuth})`)
  })
})

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

export default app