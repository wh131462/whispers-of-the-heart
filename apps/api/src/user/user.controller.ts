import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return ApiResponseDto.success(user, '用户创建成功');
  }

  @Get()
  async findAll(@Query() query: PaginationDto) {
    const { page = 1, limit = 10, search } = query;
    const users = await this.userService.findAll(page, limit, search);
    return ApiResponseDto.success(users, '获取用户列表成功');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return ApiResponseDto.success(user, '获取用户信息成功');
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(id, updateUserDto);
    return ApiResponseDto.success(user, '用户更新成功');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.userService.remove(id);
    return ApiResponseDto.success(result, '用户删除成功');
  }
}
