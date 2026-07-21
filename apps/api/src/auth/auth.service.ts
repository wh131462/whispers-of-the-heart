import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SendRegisterCodeDto,
  RegisterWithCodeDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import type { StringValue } from 'ms';

// 生成6位数字验证码
function generateVerificationCode(): string {
  return randomInt(100000, 1000000).toString();
}

interface DecodedRefreshToken {
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(identifier: string, password: string) {
    // 支持邮箱或用户名登录
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _password, ...result } = user;
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

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.isAdmin,
      user.tokenVersion,
    );

    // 保存刷新令牌
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
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
        isAdmin: true,
        avatar: true,
        tokenVersion: true,
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.isAdmin,
      user.tokenVersion,
    );

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
      this.jwtService.verify(refreshToken, {
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
        storedToken.user.isAdmin,
        storedToken.user.tokenVersion,
      );

      await this.prisma.$transaction(async (tx) => {
        const consumed = await tx.refreshToken.deleteMany({
          where: { id: storedToken.id, token: refreshToken },
        });
        if (consumed.count !== 1) {
          throw new UnauthorizedException('刷新令牌已被使用');
        }

        await tx.refreshToken.create({
          data: {
            token: tokens.refreshToken,
            userId: storedToken.user.id,
            expiresAt: this.getTokenExpiresAt(tokens.refreshToken),
          },
        });
      });

      return {
        user: {
          id: storedToken.user.id,
          username: storedToken.user.username,
          email: storedToken.user.email,
          isAdmin: storedToken.user.isAdmin,
          avatar: storedToken.user.avatar,
        },
        ...tokens,
      };
    } catch (_error) {
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

  private async generateTokens(
    userId: string,
    email: string,
    isAdmin: boolean,
    tokenVersion: number,
  ) {
    const payload = { sub: userId, email, isAdmin, tokenVersion };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: (process.env.JWT_EXPIRATION_TIME || '1h') as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRATION_TIME ||
          '7d') as StringValue,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: this.getTokenExpiresAt(token),
      },
    });
  }

  private getTokenExpiresAt(token: string): Date {
    const decoded = this.jwtService.decode<DecodedRefreshToken>(token);
    if (!decoded?.exp) {
      throw new Error('刷新令牌缺少过期时间');
    }
    return new Date(decoded.exp * 1000);
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

    // 发送重置邮件
    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.username,
      resetToken,
    );

    return { message: '密码重置邮件已发送' };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
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

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          used: false,
          expiresAt: { gt: new Date() },
        },
        data: { used: true },
      });

      if (consumed.count !== 1) {
        throw new BadRequestException('重置令牌无效、已过期或已使用');
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          tokenVersion: { increment: 1 },
        },
      });
      await tx.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      });
    });

    return { message: '密码重置成功' };
  }

  // 发送注册验证码
  async sendRegisterCode(sendRegisterCodeDto: SendRegisterCodeDto) {
    const { email } = sendRegisterCodeDto;

    // 检查邮箱是否已被注册
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    const latestCode = await this.prisma.verificationCode.findFirst({
      where: { email, type: 'register' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (latestCode && Date.now() - latestCode.createdAt.getTime() < 60 * 1000) {
      throw new BadRequestException('验证码发送过于频繁，请一分钟后再试');
    }

    // 删除该邮箱之前未使用的验证码
    await this.prisma.verificationCode.deleteMany({
      where: {
        email,
        type: 'register',
        used: false,
      },
    });

    // 生成新验证码
    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10分钟后过期

    // 保存验证码
    await this.prisma.verificationCode.create({
      data: {
        code,
        email,
        type: 'register',
        expiresAt,
      },
    });

    // 发送验证码邮件
    await this.mailService.sendRegistrationVerificationCode(email, code);

    return { message: '验证码已发送到您的邮箱' };
  }

  // 使用验证码注册
  async registerWithCode(registerWithCodeDto: RegisterWithCodeDto) {
    const { username, email, password, code } = registerWithCodeDto;

    // 验证验证码
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        type: 'register',
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationCode || verificationCode.attempts >= 5) {
      throw new BadRequestException('验证码无效');
    }

    if (verificationCode.expiresAt < new Date()) {
      throw new BadRequestException('验证码已过期');
    }

    if (verificationCode.code !== code) {
      await this.prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('验证码无效');
    }

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

    // 创建用户（邮箱已验证）
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.verificationCode.updateMany({
        where: { id: verificationCode.id, used: false, attempts: { lt: 5 } },
        data: { used: true },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException('验证码已被使用');
      }

      return tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          emailVerified: true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          isAdmin: true,
          avatar: true,
          emailVerified: true,
          tokenVersion: true,
        },
      });
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.isAdmin,
      user.tokenVersion,
    );

    // 保存刷新令牌
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // 发送欢迎邮件
    await this.mailService.sendWelcomeEmail(user.email, user.username);

    return {
      user,
      ...tokens,
    };
  }
}
