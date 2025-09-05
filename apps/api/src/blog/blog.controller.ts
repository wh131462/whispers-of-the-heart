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
  Req,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreatePostDto, UpdatePostDto, CreateTagDto, UpdateTagDto } from './dto/blog.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, PostStatus } from '@prisma/client';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // 公开的文章接口
  @Get()
  async findAll(@Query() query: any) {
    try {
      const { page = 1, limit = 10, search, status, category } = query;
      const pageNum = typeof page === 'string' ? parseInt(page, 10) : Number(page) || 1;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit) || 10;
      const posts = await this.blogService.findAllPosts(
        pageNum, 
        limitNum, 
        search, 
        status, 
        category
      );
      return ApiResponseDto.success(posts, '获取文章列表成功');
    } catch (error) {
      console.error('Controller error:', error);
      throw error;
    }
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.blogService.getCategories();
    return ApiResponseDto.success(categories, '获取分类列表成功');
  }

  @Get('tags')
  async findAllTags() {
    const tags = await this.blogService.findAllTags();
    return ApiResponseDto.success(tags, '获取标签列表成功');
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const post = await this.blogService.findPostBySlug(slug);
    return ApiResponseDto.success(post, '获取文章详情成功');
  }

  @Get('post/:id')
  async findOne(@Param('id') id: string) {
    const post = await this.blogService.findOnePost(id);
    return ApiResponseDto.success(post, '获取文章详情成功');
  }

  // 需要认证的文章管理接口
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async create(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    const post = await this.blogService.createPost(createPostDto, req.user.sub);
    return ApiResponseDto.success(post, '文章创建成功');
  }

  @Patch('post/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto, @Req() req: any) {
    const post = await this.blogService.updatePost(id, updatePostDto, req.user.sub);
    return ApiResponseDto.success(post, '文章更新成功');
  }

  @Delete('post/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.blogService.removePost(id, req.user.sub);
    return ApiResponseDto.success(result, '文章删除成功');
  }

  // 标签管理接口
  @Post('tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createTag(@Body() createTagDto: CreateTagDto) {
    const tag = await this.blogService.createTag(createTagDto);
    return ApiResponseDto.success(tag, '标签创建成功');
  }

  @Patch('tags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTag(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    const tag = await this.blogService.updateTag(id, updateTagDto);
    return ApiResponseDto.success(tag, '标签更新成功');
  }

  @Delete('tags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeTag(@Param('id') id: string) {
    const result = await this.blogService.removeTag(id);
    return ApiResponseDto.success(result, '标签删除成功');
  }

  // 点赞相关接口
  @Post('post/:id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Param('id') postId: string, @Req() req: any) {
    const result = await this.blogService.toggleLike(postId, req.user.sub);
    return ApiResponseDto.success(result, result.liked ? '点赞成功' : '取消点赞成功');
  }

  @Get('post/:id/like-status')
  async getLikeStatus(@Param('id') postId: string, @Req() req: any) {
    // 如果用户未登录，userId为null，只返回点赞数
    const userId = req.user?.sub || null;
    const result = await this.blogService.getLikeStatus(postId, userId);
    return ApiResponseDto.success(result, '获取点赞状态成功');
  }

  // 收藏相关接口
  @Post('post/:id/favorite')
  @UseGuards(JwtAuthGuard)
  async toggleFavorite(@Param('id') postId: string, @Req() req: any) {
    const result = await this.blogService.toggleFavorite(postId, req.user.sub);
    return ApiResponseDto.success(result, result.favorited ? '收藏成功' : '取消收藏成功');
  }

  @Get('post/:id/favorite-status')
  async getFavoriteStatus(@Param('id') postId: string, @Req() req: any) {
    // 如果用户未登录，userId为null，只返回未收藏状态
    const userId = req.user?.sub || null;
    const result = await this.blogService.getFavoriteStatus(postId, userId);
    return ApiResponseDto.success(result, '获取收藏状态成功');
  }

  @Get('user/favorites')
  @UseGuards(JwtAuthGuard)
  async getUserFavorites(@Req() req: any, @Query() query: any) {
    const { page = 1, limit = 10 } = query;
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : Number(page) || 1;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit) || 10;
    const result = await this.blogService.getUserFavorites(req.user.sub, pageNum, limitNum);
    return ApiResponseDto.success(result, '获取用户收藏列表成功');
  }
}
