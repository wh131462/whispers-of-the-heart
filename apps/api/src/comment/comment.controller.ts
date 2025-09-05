import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Patch,
  UseGuards,
  Req
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto, BatchCommentDto } from './dto/comment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 管理接口 - 获取所有评论
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findAll(@Query() query: PaginationDto & { status?: string; postId?: string }) {
    const { page = 1, limit = 10, search, status, postId } = query;
    const comments = await this.commentService.findAll(
      Number(page), 
      Number(limit), 
      search, 
      status, 
      postId
    );
    return ApiResponseDto.success(comments, '获取评论列表成功');
  }

  // 公开接口 - 获取文章评论
  @Get('post/:postId')
  async getPostComments(
    @Param('postId') postId: string,
    @Query() query: PaginationDto,
    @Req() req: any
  ) {
    const { page = 1, limit = 10 } = query;
    const userId = req.user?.sub || null; // 获取当前用户ID，如果没有登录则为null
    const comments = await this.commentService.findByPostId(postId, Number(page), Number(limit), userId);
    return ApiResponseDto.success(comments, '获取评论成功');
  }

  // 公开接口 - 创建评论
  @Post()
  async create(@Body() createCommentDto: CreateCommentDto, @Req() req: any) {
    // 从请求中提取IP地址和User-Agent
    const ipAddress = req.ip || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress || 
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     'unknown';
    
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 将IP地址和User-Agent添加到DTO中
    const commentData = {
      ...createCommentDto,
      ipAddress,
      userAgent
    };

    const comment = await this.commentService.create(commentData);
    return ApiResponseDto.success(comment, '评论创建成功');
  }

  // 批量审核评论 - 必须在动态路由之前
  @Patch('batch-approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async batchApprove(@Body() body: BatchCommentDto) {
    const result = await this.commentService.batchApprove(body.commentIds);
    return ApiResponseDto.success(result, '批量审核成功');
  }

  @Patch('batch-reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async batchReject(@Body() body: BatchCommentDto) {
    const result = await this.commentService.batchReject(body.commentIds);
    return ApiResponseDto.success(result, '批量拒绝成功');
  }

  // 管理接口 - 获取单个评论
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findOne(@Param('id') id: string) {
    const comment = await this.commentService.findOne(id);
    return ApiResponseDto.success(comment, '获取评论详情成功');
  }

  // 管理接口 - 更新评论
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    const comment = await this.commentService.update(id, updateCommentDto);
    return ApiResponseDto.success(comment, '评论更新成功');
  }

  // 管理接口 - 删除评论
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async remove(@Param('id') id: string) {
    const result = await this.commentService.remove(id);
    return ApiResponseDto.success(result, '评论删除成功');
  }

  // 评论点赞相关接口
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Param('id') commentId: string, @Req() req: any) {
    const result = await this.commentService.toggleLike(commentId, req.user.sub);
    return ApiResponseDto.success(result, result.liked ? '点赞成功' : '取消点赞成功');
  }

  @Get(':id/like-status')
  async getLikeStatus(@Param('id') commentId: string, @Req() req: any) {
    // 如果用户未登录，userId为null，只返回点赞数
    const userId = req.user?.sub || null;
    const result = await this.commentService.getLikeStatus(commentId, userId);
    return ApiResponseDto.success(result, '获取点赞状态成功');
  }

  // 管理接口 - 审核评论
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async approve(@Param('id') id: string) {
    const comment = await this.commentService.approve(id);
    return ApiResponseDto.success(comment, '评论审核通过');
  }

  // 管理接口 - 拒绝评论
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async reject(@Param('id') id: string) {
    const comment = await this.commentService.reject(id);
    return ApiResponseDto.success(comment, '评论已拒绝');
  }
}
