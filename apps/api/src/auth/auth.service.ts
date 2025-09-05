import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, password: string) {
    // 支持邮箱或用户名登录
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, username, password } = loginDto;
    const identifier = email || username;

    if (!identifier) {
      throw new UnauthorizedException('请提供用户名或邮箱');
    }

    const user = await this.validateUser(identifier, password);
    if (!user) {
      throw new UnauthorizedException('用户名/邮箱或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // 保存刷新令牌
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查用户名是否已存在
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictException('用户名已被使用');
    }

    // 创建用户
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // 保存刷新令牌
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // 验证刷新令牌
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      // 检查令牌是否在数据库中
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('刷新令牌无效或已过期');
      }

      // 生成新的令牌
      const tokens = await this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
        storedToken.user.role,
      );

      // 删除旧的刷新令牌
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      // 保存新的刷新令牌
      await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken);

      return {
        user: {
          id: storedToken.user.id,
          username: storedToken.user.username,
          email: storedToken.user.email,
          role: storedToken.user.role,
          avatar: storedToken.user.avatar,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }

  async logout(userId: string) {
    // 删除用户的刷新令牌
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: '退出登录成功' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION_TIME || '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return { message: '如果邮箱存在，重置邮件已发送' };
    }

    // 生成重置令牌
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1小时后过期

    // 保存重置令牌
    await this.prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    // TODO: 发送重置邮件
    // 这里应该集成邮件服务，发送重置链接
    console.log(`Password reset link: http://localhost:8888/reset-password?token=${resetToken}`);

    return { message: '密码重置邮件已发送' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    // 查找重置令牌
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('无效的重置令牌');
    }

    if (resetToken.used) {
      throw new BadRequestException('重置令牌已被使用');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('重置令牌已过期');
    }

    // 更新用户密码
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // 标记令牌为已使用
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return { message: '密码重置成功' };
  }
}
