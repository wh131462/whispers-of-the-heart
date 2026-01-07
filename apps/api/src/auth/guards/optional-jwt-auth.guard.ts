import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 可选 JWT 认证 Guard
 * 如果请求携带有效的 JWT token，则解析并注入 req.user
 * 如果没有 token 或 token 无效，请求仍然可以通过，但 req.user 为 undefined
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, _info: any, _context: ExecutionContext) {
    // 即使没有用户（未登录或 token 无效），也允许请求通过
    // 但会将 user 设置为 undefined
    return user;
  }
}
