import jwt from 'jsonwebtoken'
import logger from '../utils/logger.js'

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret')
    req.user = decoded
    next()
  } catch (error) {
    logger.error('Auth middleware error:', error)
    return res.status(401).json({
      code: 401,
      message: '认证令牌无效'
    })
  }
}

export default authMiddleware