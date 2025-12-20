import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set. Please configure it in your .env file.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
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
      isAdmin: payload.isAdmin === true, // 从JWT payload读取isAdmin
    };
  }
}
