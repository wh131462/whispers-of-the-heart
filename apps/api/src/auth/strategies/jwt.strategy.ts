import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: any) {
    console.log('JWT payload:', payload);
    
    // 确保用户ID存在
    const userId = payload.sub || payload.id || payload.userId;
    if (!userId) {
      console.error('No user ID found in JWT payload:', payload);
      throw new Error('Invalid token: missing user ID');
    }
    
    return {
      id: userId,  // 统一使用id字段
      sub: userId, // 保持向后兼容
      email: payload.email,
      role: payload.role,
    };
  }
}
