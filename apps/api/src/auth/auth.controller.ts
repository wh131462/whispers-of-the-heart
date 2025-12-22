import { Controller, Post, Body, UseGuards, Get, Req, Patch, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, SendRegisterCodeDto, RegisterWithCodeDto } from './dto/auth.dto';
import { SendEmailChangeCodeDto, ChangeEmailDto, CheckUsernameDto, UpdateProfileDto } from '../user/dto/user.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return ApiResponseDto.success(result, '登录成功');
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return ApiResponseDto.success(result, '注册成功');
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return ApiResponseDto.success(result, '令牌刷新成功');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const result = await this.authService.logout(req.user.sub);
    return ApiResponseDto.success(result, '退出登录成功');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return ApiResponseDto.success(req.user, '获取用户信息成功');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    const user = await this.authService.getUserById(req.user.sub);
    return ApiResponseDto.success(user, '获取当前用户信息成功');
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    return ApiResponseDto.success(result, '密码重置邮件已发送');
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return ApiResponseDto.success(result, '密码重置成功');
  }

  @Post('send-register-code')
  async sendRegisterCode(@Body() sendRegisterCodeDto: SendRegisterCodeDto) {
    const result = await this.authService.sendRegisterCode(sendRegisterCodeDto);
    return ApiResponseDto.success(result, '验证码已发送');
  }

  @Post('register-with-code')
  async registerWithCode(@Body() registerWithCodeDto: RegisterWithCodeDto) {
    const result = await this.authService.registerWithCode(registerWithCodeDto);
    return ApiResponseDto.success(result, '注册成功');
  }

  @Post('send-email-change-code')
  @UseGuards(JwtAuthGuard)
  async sendEmailChangeCode(@Req() req: any, @Body() sendEmailChangeCodeDto: SendEmailChangeCodeDto) {
    const result = await this.userService.sendEmailChangeCode(req.user.sub, sendEmailChangeCodeDto);
    return ApiResponseDto.success(result, '验证码已发送');
  }

  @Post('change-email')
  @UseGuards(JwtAuthGuard)
  async changeEmail(@Req() req: any, @Body() changeEmailDto: ChangeEmailDto) {
    const result = await this.userService.changeEmail(req.user.sub, changeEmailDto);
    return ApiResponseDto.success(result, '邮箱更换成功');
  }

  @Get('check-username')
  @UseGuards(JwtAuthGuard)
  async checkUsername(@Req() req: any, @Query() query: CheckUsernameDto) {
    const result = await this.userService.checkUsernameAvailable(query.username, req.user.sub);
    return ApiResponseDto.success(result);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    const result = await this.userService.updateProfile(req.user.sub, updateProfileDto);
    return ApiResponseDto.success(result, '资料更新成功');
  }
}
