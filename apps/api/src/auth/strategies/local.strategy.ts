import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  async validate(username: string, password: string): Promise<any> {
    // TODO: 实现用户验证逻辑
    return { userId: 1, username };
  }
}
