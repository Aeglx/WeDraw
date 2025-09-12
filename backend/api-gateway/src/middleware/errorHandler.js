import logger from '../utils/logger.js'

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  })

  // 默认错误响应
  let statusCode = 500
  let message = '服务器内部错误'

  // 根据错误类型设置响应
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = '请求参数验证失败'
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    message = '未授权访问'
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403
    message = '禁止访问'
  } else if (err.name === 'NotFoundError') {
    statusCode = 404
    message = '资源不存在'
  }

  res.status(statusCode).json({
    code: statusCode,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  })
}

export default errorHandler