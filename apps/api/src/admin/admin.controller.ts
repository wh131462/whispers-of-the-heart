import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { BlogService } from '../blog/blog.service';
import { CommentService } from '../comment/comment.service';
import { UserService } from '../user/user.service';
import { SiteConfigService } from '../site-config/site-config.service';
import { MailService } from '../mail/mail.service';
import { CreateTagDto, UpdateTagDto } from '../blog/dto/blog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly blogService: BlogService,
    private readonly commentService: CommentService,
    private readonly userService: UserService,
    private readonly siteConfigService: SiteConfigService,
    private readonly mailService: MailService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    try {
      const data = await this.adminService.getDashboard();
      return {
        success: true,
        data,
        message: 'Dashboard data retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve dashboard data',
      };
    }
  }

  // 标签管理接口
  @Get('tags')
  async getTags() {
    try {
      const tags = await this.blogService.findAllTags();
      return {
        success: true,
        data: tags,
        message: '获取标签列表成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取标签列表失败',
      };
    }
  }

  @Get('tags/:id')
  async getTagById(@Param('id') id: string) {
    try {
      const tag = await this.blogService.getTagById(id);
      return {
        success: true,
        data: tag,
        message: '获取标签详情成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取标签详情失败',
      };
    }
  }

  @Post('tags')
  async createTag(@Body() createTagDto: CreateTagDto) {
    try {
      const tag = await this.blogService.createTag(createTagDto);
      return {
        success: true,
        data: {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          color: tag.color,
          postCount: 0,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        },
        message: '创建标签成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '创建标签失败',
      };
    }
  }

  @Patch('tags/:id')
  async updateTag(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    try {
      const tag = await this.blogService.updateTag(id, updateTagDto);
      return {
        success: true,
        data: {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          color: tag.color,
          postCount: 0,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        },
        message: '更新标签成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '更新标签失败',
      };
    }
  }

  @Delete('tags/:id')
  async deleteTag(@Param('id') id: string) {
    try {
      const result = await this.blogService.removeTag(id);
      return {
        success: true,
        data: result,
        message: '删除标签成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '删除标签失败',
      };
    }
  }

  @Get('tags/:id/posts')
  async getTagPosts(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1') || 1;
      const limitNum = parseInt(limit || '10') || 10;
      const result = await this.blogService.getTagPosts(id, pageNum, limitNum);
      return {
        success: true,
        data: result,
        message: '获取标签文章成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取标签文章失败',
      };
    }
  }

  // ==================== 评论管理接口 ====================
  @Get('comments')
  async getComments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1') || 1;
      const limitNum = parseInt(limit || '20') || 20;
      const result = await this.commentService.findAll(
        pageNum,
        limitNum,
        search,
        status,
      );
      return {
        success: true,
        data: result,
        message: '获取评论列表成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取评论列表失败',
      };
    }
  }

  // ==================== 评论统计接口 ====================
  @Get('comments/stats')
  async getCommentStats() {
    try {
      const stats = await this.commentService.getStats();
      return {
        success: true,
        data: stats,
        message: '获取评论统计成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取评论统计失败',
      };
    }
  }

  // ==================== 评论回收站接口 ====================
  @Get('comments/trash')
  async getTrashComments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1') || 1;
      const limitNum = parseInt(limit || '20') || 20;
      const result = await this.commentService.getTrash(pageNum, limitNum);
      return {
        success: true,
        data: result,
        message: '获取回收站评论成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取回收站评论失败',
      };
    }
  }

  // ==================== 评论举报接口 ====================
  @Get('comments/reports')
  async getCommentReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1') || 1;
      const limitNum = parseInt(limit || '20') || 20;
      const result = await this.commentService.getReports(
        pageNum,
        limitNum,
        status || 'pending',
      );
      return {
        success: true,
        data: result,
        message: '获取举报列表成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取举报列表失败',
      };
    }
  }

  // 注意：参数化路由必须放在具体路由之后
  @Get('comments/:id')
  async getCommentById(@Param('id') id: string) {
    try {
      const comment = await this.commentService.findOne(id);
      return {
        success: true,
        data: comment,
        message: '获取评论详情成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取评论详情失败',
      };
    }
  }

  @Patch('comments/:id/approve')
  async approveComment(@Param('id') id: string) {
    try {
      const comment = await this.commentService.approve(id);
      return {
        success: true,
        data: comment,
        message: '评论审核通过',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '审核失败',
      };
    }
  }

  @Patch('comments/:id/reject')
  async rejectComment(@Param('id') id: string) {
    try {
      const comment = await this.commentService.reject(id);
      return {
        success: true,
        data: comment,
        message: '评论已拒绝',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '操作失败',
      };
    }
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string) {
    try {
      const result = await this.commentService.remove(id);
      return {
        success: true,
        data: result,
        message: '评论删除成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '删除失败',
      };
    }
  }

  @Post('comments/batch-approve')
  async batchApproveComments(@Body() body: { ids: string[] }) {
    try {
      const result = await this.commentService.batchApprove(body.ids);
      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '批量审核失败',
      };
    }
  }

  @Patch('comments/:id/soft-delete')
  async softDeleteComment(@Param('id') id: string) {
    try {
      const result = await this.commentService.softDelete(id);
      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '删除失败',
      };
    }
  }

  @Patch('comments/:id/restore')
  async restoreComment(@Param('id') id: string) {
    try {
      const result = await this.commentService.restore(id);
      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '恢复失败',
      };
    }
  }

  @Delete('comments/:id/permanent')
  async permanentDeleteComment(@Param('id') id: string) {
    try {
      const result = await this.commentService.permanentDelete(id);
      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '永久删除失败',
      };
    }
  }

  @Patch('comments/:id/pin')
  async togglePinComment(@Param('id') id: string) {
    try {
      // Admin can always pin comments
      const result = await this.commentService.togglePin(id, '', true);
      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '操作失败',
      };
    }
  }

  @Patch('comments/reports/:reportId')
  async resolveCommentReport(
    @Param('reportId') reportId: string,
    @Body() body: { action: 'resolve' | 'dismiss'; deleteComment?: boolean },
  ) {
    try {
      const result = await this.commentService.resolveReport(
        reportId,
        body.action,
        body.deleteComment,
      );
      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '处理举报失败',
      };
    }
  }

  // ==================== 用户管理接口 ====================
  @Get('users')
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1') || 1;
      const limitNum = parseInt(limit || '20') || 20;
      const result = await this.userService.findAll(pageNum, limitNum, search);
      return {
        success: true,
        data: result,
        message: '获取用户列表成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取用户列表失败',
      };
    }
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.userService.findOne(id);
      return {
        success: true,
        data: user,
        message: '获取用户详情成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取用户详情失败',
      };
    }
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    try {
      const user = await this.userService.update(id, updateData);
      return {
        success: true,
        data: user,
        message: '用户更新成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '用户更新失败',
      };
    }
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    try {
      const result = await this.userService.remove(id);
      return {
        success: true,
        data: result,
        message: '用户删除成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '用户删除失败',
      };
    }
  }

  // ==================== 站点配置接口 ====================
  @Get('site-config')
  async getSiteConfig() {
    try {
      const config = await this.siteConfigService.findOne();
      return {
        success: true,
        data: config,
        message: '获取站点配置成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取站点配置失败',
      };
    }
  }

  @Put('site-config')
  async updateSiteConfig(@Body() updateData: any) {
    try {
      // 先获取现有配置
      const existingConfig = await this.siteConfigService.findOne();

      // 如果是默认配置（没有ID或ID为'default'），则创建新配置
      if (!existingConfig || existingConfig.id === 'default') {
        const newConfig = await this.siteConfigService.create(updateData);
        return {
          success: true,
          data: newConfig,
          message: '站点配置创建成功',
        };
      }

      // 否则更新现有配置
      const config = await this.siteConfigService.update(
        existingConfig.id,
        updateData,
      );
      return {
        success: true,
        data: config,
        message: '站点配置更新成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '站点配置更新失败',
      };
    }
  }

  @Patch('site-config/:id')
  async patchSiteConfig(@Param('id') id: string, @Body() updateData: any) {
    try {
      const config = await this.siteConfigService.update(id, updateData);
      return {
        success: true,
        data: config,
        message: '站点配置更新成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '站点配置更新失败',
      };
    }
  }

  // ==================== 邮件管理接口 ====================
  @Get('mail/logs')
  async getMailLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1') || 1;
      const limitNum = parseInt(limit || '20') || 20;
      const result = await this.mailService.getMailLogs(
        pageNum,
        limitNum,
        status,
        search,
      );
      return {
        success: true,
        data: result,
        message: '获取邮件记录成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取邮件记录失败',
      };
    }
  }

  @Get('mail/stats')
  async getMailStats() {
    try {
      const stats = await this.mailService.getMailStats();
      return {
        success: true,
        data: stats,
        message: '获取邮件统计成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取邮件统计失败',
      };
    }
  }

  @Get('mail/status')
  async getMailStatus() {
    try {
      const status = this.mailService.getStatus();
      return {
        success: true,
        data: status,
        message: '获取邮件服务状态成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取邮件服务状态失败',
      };
    }
  }

  @Get('mail/logs/:id')
  async getMailLogById(@Param('id') id: string) {
    try {
      const log = await this.mailService.getMailLogById(id);
      if (!log) {
        return {
          success: false,
          data: null,
          message: '邮件记录不存在',
        };
      }
      return {
        success: true,
        data: log,
        message: '获取邮件详情成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取邮件详情失败',
      };
    }
  }

  @Post('mail/test')
  async sendTestMail(@Body() body: { to: string }) {
    try {
      if (!body.to) {
        return {
          success: false,
          data: null,
          message: '请提供收件人邮箱',
        };
      }
      const result = await this.mailService.sendTestMail(body.to);
      return {
        success: result,
        data: { sent: result },
        message: result ? '测试邮件发送成功' : '测试邮件发送失败',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '发送测试邮件失败',
      };
    }
  }
}
