import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common'
import { logger } from './winston.config'

@Injectable()
export class LoggerService implements NestLoggerService {
  /**
   * 记录日志
   */
  log(message: string, context?: string) {
    logger.info(message, { context })
  }

  /**
   * 记录错误
   */
  error(message: string, trace?: string, context?: string) {
    logger.error(message, { trace, context })
  }

  /**
   * 记录警告
   */
  warn(message: string, context?: string) {
    logger.warn(message, { context })
  }

  /**
   * 记录调试信息
   */
  debug(message: string, context?: string) {
    logger.debug(message, { context })
  }

  /**
   * 记录详细信息
   */
  verbose(message: string, context?: string) {
    logger.debug(message, { context })
  }

  /**
   * 记录 HTTP 请求
   */
  http(message: string, meta?: any) {
    logger.http(message, meta)
  }

  /**
   * 记录业务操作
   */
  logOperation(operation: string, userId?: string, details?: any) {
    logger.info(`Operation: ${operation}`, {
      operation,
      userId,
      details,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * 记录数据库操作
   */
  logDatabase(action: string, table: string, details?: any) {
    logger.debug(`Database: ${action} on ${table}`, {
      action,
      table,
      details,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * 记录认证事件
   */
  logAuth(event: string, userId?: string, details?: any) {
    logger.info(`Auth: ${event}`, {
      event,
      userId,
      details,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * 记录安全事件
   */
  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any) {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn'
    logger.log(level, `Security: ${event}`, {
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * 记录性能指标
   */
  logPerformance(operation: string, duration: number, details?: any) {
    const level = duration > 1000 ? 'warn' : 'debug'
    logger.log(level, `Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString(),
    })
  }
}

