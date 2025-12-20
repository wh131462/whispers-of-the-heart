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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreatePostDto, UpdatePostDto, CreateTagDto, UpdateTagDto } from './dto/blog.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/roles.guard';

@ApiTags('博客')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // 公开的文章接口
  @Get()
  @ApiOperation({ summary: '获取文章列表', description: '获取所有文章列表，支持分页和搜索' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'published', required: false, description: '是否已发布' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: any) {
    try {
      const { page = 1, limit = 10, search, published } = query;
      const pageNum = typeof page === 'string' ? parseInt(page, 10) : Number(page) || 1;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit) || 10;
      const isPublished = published === 'true' ? true : published === 'false' ? false : undefined;
      const posts = await this.blogService.findAllPosts(pageNum, limitNum, search, isPublished);
      return ApiResponseDto.success(posts, '获取文章列表成功');
    } catch (error) {
      console.error('Controller error:', error);
      throw error;
    }
  }

  @Get('search')
  @ApiOperation({ summary: '搜索文章', description: '根据关键词搜索文章，支持多种排序方式' })
  @ApiQuery({ name: 'q', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'tag', required: false, description: '标签ID或名称' })
  @ApiQuery({ name: 'sortBy', required: false, description: '排序字段', enum: ['createdAt', 'views', 'publishedAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, description: '排序方向', enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async search(@Query() query: any) {
    try {
      const {
        q,
        page = 1,
        limit = 20,
        tag,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const pageNum = typeof page === 'string' ? parseInt(page, 10) : Number(page) || 1;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit) || 20;

      const results = await this.blogService.searchPosts({
        query: q,
        page: pageNum,
        limit: limitNum,
        tag,
        sortBy,
        sortOrder
      });

      return ApiResponseDto.success(results, '搜索成功');
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  @Get('tags')
  @ApiOperation({ summary: '获取标签列表', description: '获取所有标签及其文章数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAllTags() {
    const tags = await this.blogService.findAllTags();
    return ApiResponseDto.success(tags, '获取标签列表成功');
  }

  @Get('categories')
  @ApiOperation({ summary: '获取分类列表', description: '获取所有分类及其文章数量（别名为标签）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAllCategories() {
    // 分类即标签，返回相同数据
    const tags = await this.blogService.findAllTags();
    // 转换为前端期望的格式
    const categories = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      count: tag.postCount,
    }));
    return ApiResponseDto.success(categories, '获取分类列表成功');
  }

  @Get('stats')
  @ApiOperation({ summary: '获取站点统计', description: '获取站点文章、评论、浏览、点赞等统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStats() {
    const stats = await this.blogService.getSiteStats();
    return ApiResponseDto.success(stats, '获取站点统计成功');
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: '通过slug获取文章', description: '根据文章slug获取文章详情' })
  @ApiParam({ name: 'slug', description: '文章slug' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  async findBySlug(@Param('slug') slug: string) {
    const post = await this.blogService.findPostBySlug(slug);
    return ApiResponseDto.success(post, '获取文章详情成功');
  }

  @Get('post/:id')
  @ApiOperation({ summary: '获取文章详情', description: '根据ID获取文章详情' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  async findOne(@Param('id') id: string) {
    const post = await this.blogService.findOnePost(id);
    return ApiResponseDto.success(post, '获取文章详情成功');
  }

  // 专门用于编辑的接口，不增加访问量
  @Get('post/:id/edit')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取编辑文章详情', description: '获取文章详情用于编辑，不增加访问量' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findOneForEdit(@Param('id') id: string) {
    const post = await this.blogService.findOnePostForEdit(id);
    return ApiResponseDto.success(post, '获取编辑文章详情成功');
  }

  // 需要认证的文章管理接口
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建文章', description: '创建新文章，需要管理员权限' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async create(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        throw new Error('用户ID未找到');
      }

      const post = await this.blogService.createPost(createPostDto, userId);
      return ApiResponseDto.success(post, '文章创建成功');
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  @Patch('post/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新文章', description: '更新文章内容，需要管理员权限' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto, @Req() req: any) {
    const post = await this.blogService.updatePost(id, updatePostDto, req.user.sub);
    return ApiResponseDto.success(post, '文章更新成功');
  }

  @Delete('post/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除文章', description: '删除文章，需要管理员权限' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.blogService.removePost(id, req.user.sub);
    return ApiResponseDto.success(result, '文章删除成功');
  }

  // 标签管理接口
  @Post('tags')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建标签', description: '创建新标签，需要管理员权限' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 409, description: '标签已存在' })
  async createTag(@Body() createTagDto: CreateTagDto) {
    const tag = await this.blogService.createTag(createTagDto);
    return ApiResponseDto.success(tag, '标签创建成功');
  }

  @Get('tags/:id')
  @ApiOperation({ summary: '获取标签详情', description: '根据ID获取标签详情' })
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  async getTagById(@Param('id') id: string) {
    const tag = await this.blogService.getTagById(id);
    return ApiResponseDto.success(tag, '获取标签详情成功');
  }

  @Get('tags/:id/posts')
  @ApiOperation({ summary: '获取标签下的文章', description: '获取指定标签下的所有文章' })
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTagPosts(@Param('id') id: string, @Query() query: any) {
    const { page = 1, limit = 10 } = query;
    const posts = await this.blogService.getTagPosts(id, Number(page), Number(limit));
    return ApiResponseDto.success(posts, '获取标签文章成功');
  }

  @Patch('tags/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新标签', description: '更新标签信息，需要管理员权限' })
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  async updateTag(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    const tag = await this.blogService.updateTag(id, updateTagDto);
    return ApiResponseDto.success(tag, '标签更新成功');
  }

  @Delete('tags/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除标签', description: '删除标签，需要管理员权限' })
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  async removeTag(@Param('id') id: string) {
    const result = await this.blogService.removeTag(id);
    return ApiResponseDto.success(result, '标签删除成功');
  }

  // 点赞相关接口
  @Post('post/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换点赞状态', description: '点赞或取消点赞文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async toggleLike(@Param('id') postId: string, @Req() req: any) {
    const result = await this.blogService.toggleLike(postId, req.user.sub);
    return ApiResponseDto.success(result, result.liked ? '点赞成功' : '取消点赞成功');
  }

  @Get('post/:id/like-status')
  @ApiOperation({ summary: '获取点赞状态', description: '获取当前用户对文章的点赞状态' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLikeStatus(@Param('id') postId: string, @Req() req: any) {
    const userId = req.user?.sub || null;
    const result = await this.blogService.getLikeStatus(postId, userId);
    return ApiResponseDto.success(result, '获取点赞状态成功');
  }

  // 收藏相关接口
  @Post('post/:id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换收藏状态', description: '收藏或取消收藏文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async toggleFavorite(@Param('id') postId: string, @Req() req: any) {
    const result = await this.blogService.toggleFavorite(postId, req.user.sub);
    return ApiResponseDto.success(result, result.favorited ? '收藏成功' : '取消收藏成功');
  }

  @Get('post/:id/favorite-status')
  @ApiOperation({ summary: '获取收藏状态', description: '获取当前用户对文章的收藏状态' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFavoriteStatus(@Param('id') postId: string, @Req() req: any) {
    const userId = req.user?.sub || null;
    const result = await this.blogService.getFavoriteStatus(postId, userId);
    return ApiResponseDto.success(result, '获取收藏状态成功');
  }

  @Get('user/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户收藏列表', description: '获取当前用户的收藏文章列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getUserFavorites(@Req() req: any, @Query() query: any) {
    const { page = 1, limit = 10 } = query;
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : Number(page) || 1;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit) || 10;
    const result = await this.blogService.getUserFavorites(req.user.sub, pageNum, limitNum);
    return ApiResponseDto.success(result, '获取用户收藏列表成功');
  }
}
