import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * AdminGuard - 简化的权限守卫
 * 仅检查用户是否为管理员
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user?.isAdmin === true;
  }
}

// 保留 RolesGuard 别名以保持向后兼容
export { AdminGuard as RolesGuard };
