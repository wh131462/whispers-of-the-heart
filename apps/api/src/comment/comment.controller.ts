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
import {
  CreateCommentDto,
  UpdateCommentDto,
  BatchCommentDto,
  UserEditCommentDto,
  ReportCommentDto,
  ResolveReportDto,
} from './dto/comment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/roles.guard';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 管理接口 - 获取所有评论
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
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
    @Query() query: PaginationDto & { sortBy?: 'newest' | 'oldest' | 'popular' },
    @Req() req: any
  ) {
    const { page = 1, limit = 10, sortBy = 'newest' } = query;
    const userId = req.user?.sub || null;
    const comments = await this.commentService.findByPostId(
      postId,
      Number(page),
      Number(limit),
      userId,
      sortBy,
    );
    return ApiResponseDto.success(comments, '获取评论成功');
  }

  // 创建评论 - 需要登录
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createCommentDto: CreateCommentDto, @Req() req: any) {
    const ipAddress = req.ip ||
                     req.connection?.remoteAddress ||
                     req.socket?.remoteAddress ||
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     'unknown';

    const userAgent = req.headers['user-agent'] || 'unknown';

    // 从 JWT token 获取 authorId
    const authorId = req.user?.sub || req.user?.id;

    const commentData = {
      ...createCommentDto,
      authorId,
      ipAddress,
      userAgent
    };

    const comment = await this.commentService.create(commentData);
    return ApiResponseDto.success(comment, '评论创建成功');
  }

  // 批量审核评论
  @Patch('batch-approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async batchApprove(@Body() body: BatchCommentDto) {
    const result = await this.commentService.batchApprove(body.commentIds);
    return ApiResponseDto.success(result, '批量审核成功');
  }

  @Patch('batch-reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async batchReject(@Body() body: BatchCommentDto) {
    const result = await this.commentService.batchReject(body.commentIds);
    return ApiResponseDto.success(result, '批量拒绝成功');
  }

  // 管理接口 - 获取单个评论
  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findOne(@Param('id') id: string) {
    const comment = await this.commentService.findOne(id);
    return ApiResponseDto.success(comment, '获取评论详情成功');
  }

  // 管理接口 - 更新评论
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    const comment = await this.commentService.update(id, updateCommentDto);
    return ApiResponseDto.success(comment, '评论更新成功');
  }

  // 管理接口 - 删除评论
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
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
    const userId = req.user?.sub || null;
    const result = await this.commentService.getLikeStatus(commentId, userId);
    return ApiResponseDto.success(result, '获取点赞状态成功');
  }

  // 管理接口 - 审核评论
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approve(@Param('id') id: string) {
    const comment = await this.commentService.approve(id);
    return ApiResponseDto.success(comment, '评论审核通过');
  }

  // 管理接口 - 拒绝评论
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async reject(@Param('id') id: string) {
    const comment = await this.commentService.reject(id);
    return ApiResponseDto.success(comment, '评论已拒绝');
  }

  // ===== 新增功能：软删除 =====

  // 管理接口 - 软删除评论
  @Patch(':id/soft-delete')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async softDelete(@Param('id') id: string) {
    const result = await this.commentService.softDelete(id);
    return ApiResponseDto.success(result, result.message);
  }

  // 管理接口 - 恢复评论
  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async restore(@Param('id') id: string) {
    const result = await this.commentService.restore(id);
    return ApiResponseDto.success(result, result.message);
  }

  // 管理接口 - 永久删除评论
  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async permanentDelete(@Param('id') id: string) {
    const result = await this.commentService.permanentDelete(id);
    return ApiResponseDto.success(result, result.message);
  }

  // 管理接口 - 获取回收站评论
  @Get('admin/trash')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getTrash(@Query() query: PaginationDto) {
    const { page = 1, limit = 10 } = query;
    const result = await this.commentService.getTrash(Number(page), Number(limit));
    return ApiResponseDto.success(result, '获取回收站评论成功');
  }

  // ===== 新增功能：用户编辑评论 =====

  // 用户编辑自己的评论
  @Patch(':id/edit')
  @UseGuards(JwtAuthGuard)
  async userEdit(
    @Param('id') id: string,
    @Body() dto: UserEditCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    const comment = await this.commentService.userEdit(id, userId, dto.content);
    return ApiResponseDto.success(comment, '评论编辑成功');
  }

  // ===== 新增功能：置顶评论 =====

  // 置顶/取消置顶评论
  @Patch(':id/pin')
  @UseGuards(JwtAuthGuard)
  async togglePin(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    const isAdmin = req.user.isAdmin;
    const result = await this.commentService.togglePin(id, userId, isAdmin);
    return ApiResponseDto.success(result, result.message);
  }

  // ===== 新增功能：举报评论 =====

  // 举报评论
  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  async reportComment(
    @Param('id') commentId: string,
    @Body() dto: ReportCommentDto,
    @Req() req: any,
  ) {
    const reporterId = req.user.sub;
    const result = await this.commentService.reportComment(
      commentId,
      reporterId,
      dto.reason,
      dto.details,
    );
    return ApiResponseDto.success(result, result.message);
  }

  // 管理接口 - 获取举报列表
  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getReports(@Query() query: PaginationDto & { status?: string }) {
    const { page = 1, limit = 10, status = 'pending' } = query;
    const result = await this.commentService.getReports(
      Number(page),
      Number(limit),
      status,
    );
    return ApiResponseDto.success(result, '获取举报列表成功');
  }

  // 管理接口 - 处理举报
  @Patch('admin/reports/:reportId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async resolveReport(
    @Param('reportId') reportId: string,
    @Body() dto: ResolveReportDto,
  ) {
    const result = await this.commentService.resolveReport(
      reportId,
      dto.action,
      dto.deleteComment,
    );
    return ApiResponseDto.success(result, result.message);
  }

  // 管理接口 - 获取评论统计数据
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStats() {
    const stats = await this.commentService.getStats();
    return ApiResponseDto.success(stats, '获取评论统计成功');
  }
}
