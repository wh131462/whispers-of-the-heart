import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, SendEmailChangeCodeDto, ChangeEmailDto } from './dto/user.dto';
import { MediaUsageService } from '../media/media-usage.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

// 生成6位数字验证码
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private mediaUsageService: MediaUsageService,
    private mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查用户名是否已存在
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (existingUsername) {
      throw new ConflictException('用户名已被使用');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        avatar: true,
        bio: true,
        theme: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 同步头像媒体使用记录
    if (userData.avatar) {
      await this.mediaUsageService.syncDirectUsage('user', user.id, 'avatar', userData.avatar);
    }

    return user;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as any } },
            { email: { contains: search, mode: 'insensitive' as any } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          isAdmin: true,
          avatar: true,
          bio: true,
          theme: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        avatar: true,
        bio: true,
        theme: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            likes: true,
          },
        },
        posts: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            published: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // 检查用户名是否可用
  async checkUsernameAvailable(username: string, excludeUserId?: string): Promise<{ available: boolean; message?: string }> {
    if (!username || username.trim().length === 0) {
      return { available: false, message: '用户名不能为空' };
    }

    if (username.length < 2) {
      return { available: false, message: '用户名至少需要2个字符' };
    }

    if (username.length > 20) {
      return { available: false, message: '用户名不能超过20个字符' };
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== excludeUserId) {
      return { available: false, message: '该用户名已被使用' };
    }

    return { available: true };
  }

  // 更新当前用户资料
  async updateProfile(userId: string, data: { username?: string; bio?: string; avatar?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 如果更新用户名，检查是否与其他用户冲突
    if (data.username && data.username !== user.username) {
      const checkResult = await this.checkUsernameAvailable(data.username, userId);
      if (!checkResult.available) {
        throw new ConflictException(checkResult.message);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        avatar: true,
        bio: true,
        theme: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 同步头像媒体使用记录
    if ('avatar' in data) {
      await this.mediaUsageService.syncDirectUsage('user', userId, 'avatar', data.avatar);
    }

    return updatedUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...updateData } = updateUserDto;

    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('用户不存在');
    }

    // 如果更新邮箱，检查是否与其他用户冲突
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (emailExists) {
        throw new ConflictException('邮箱已被其他用户使用');
      }
    }

    // 如果更新用户名，检查是否与其他用户冲突
    if (updateData.username && updateData.username !== existingUser.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: updateData.username },
      });

      if (usernameExists) {
        throw new ConflictException('用户名已被其他用户使用');
      }
    }

    // 如果更新密码，需要加密
    const data: any = { ...updateData };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        avatar: true,
        bio: true,
        theme: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 同步头像媒体使用记录（如果头像字段有更新）
    if ('avatar' in updateData) {
      await this.mediaUsageService.syncDirectUsage('user', id, 'avatar', updateData.avatar);
    }

    return user;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 删除用户的媒体使用记录
    await this.mediaUsageService.deleteEntityUsages('user', id);

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: '用户删除成功' };
  }

  async toggleAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isAdmin: !user.isAdmin },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  // 发送邮箱更换验证码
  async sendEmailChangeCode(userId: string, sendEmailChangeCodeDto: SendEmailChangeCodeDto) {
    const { newEmail } = sendEmailChangeCodeDto;

    // 获取当前用户
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查新邮箱是否已被使用
    const existingUser = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被其他用户使用');
    }

    // 删除该用户之前未使用的邮箱更换验证码
    await this.prisma.verificationCode.deleteMany({
      where: {
        userId,
        type: 'email_change',
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
        email: newEmail,
        userId,
        type: 'email_change',
        expiresAt,
      },
    });

    // 发送验证码邮件到新邮箱
    await this.mailService.sendEmailChangeVerificationCode(newEmail, user.username, code);

    return { message: '验证码已发送到新邮箱' };
  }

  // 验证并更换邮箱
  async changeEmail(userId: string, changeEmailDto: ChangeEmailDto) {
    const { newEmail, code } = changeEmailDto;

    // 获取当前用户
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证验证码
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        email: newEmail,
        code,
        type: 'email_change',
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('验证码无效');
    }

    if (verificationCode.expiresAt < new Date()) {
      throw new BadRequestException('验证码已过期');
    }

    // 再次检查新邮箱是否已被使用
    const existingUser = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被其他用户使用');
    }

    // 更新用户邮箱
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        avatar: true,
        bio: true,
        theme: true,
        emailVerified: true,
      },
    });

    // 标记验证码为已使用
    await this.prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    return updatedUser;
  }
}
