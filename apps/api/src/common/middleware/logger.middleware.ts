import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { logger } from '../logger/winston.config'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req
    const userAgent = req.get('user-agent') || ''
    const startTime = Date.now()

    // 记录请求
    logger.http(`Incoming Request: ${method} ${originalUrl}`, {
      method,
      url: originalUrl,
      ip,
      userAgent,
    })

    // 监听响应完成
    res.on('finish', () => {
      const { statusCode } = res
      const responseTime = Date.now() - startTime

      // 根据状态码选择日志级别
      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http'

      logger.log(level, `Response: ${method} ${originalUrl} ${statusCode}`, {
        method,
        url: originalUrl,
        statusCode,
        responseTime: `${responseTime}ms`,
        ip,
        userAgent,
      })
    })

    next()
  }
}

