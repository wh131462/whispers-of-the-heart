import { Controller, Get, Post, Put, Delete, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { BlogService } from '../blog/blog.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateTagDto, UpdateTagDto } from '../blog/dto/blog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EDITOR)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly blogService: BlogService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    try {
      const data = await this.adminService.getDashboard();
      return {
        success: true,
        data,
        message: 'Dashboard data retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve dashboard data'
      };
    }
  }

  // 分类管理接口
  @Get('categories')
  async getCategories() {
    try {
      const categories = await this.blogService.getAllCategories();
      return {
        success: true,
        data: categories,
        message: '获取分类列表成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取分类列表失败'
      };
    }
  }

  @Get('categories/:id')
  async getCategoryById(@Param('id') id: string) {
    try {
      const category = await this.blogService.getCategoryById(id);
      return {
        success: true,
        data: category,
        message: '获取分类详情成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取分类详情失败'
      };
    }
  }

  @Post('categories')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    try {
      const category = await this.blogService.createCategory(createCategoryDto);
      return {
        success: true,
        data: category,
        message: '创建分类成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '创建分类失败'
      };
    }
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    try {
      const category = await this.blogService.updateCategory(id, updateCategoryDto);
      return {
        success: true,
        data: category,
        message: '更新分类成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '更新分类失败'
      };
    }
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    try {
      const result = await this.blogService.deleteCategory(id);
      return {
        success: true,
        data: result,
        message: '删除分类成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '删除分类失败'
      };
    }
  }

  @Get('categories/:id/posts')
  async getCategoryPosts(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1') || 1;
      const limitNum = parseInt(limit || '10') || 10;
      const result = await this.blogService.getCategoryPosts(id, pageNum, limitNum);
      return {
        success: true,
        data: result,
        message: '获取分类文章成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取分类文章失败'
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
        message: '获取标签列表成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取标签列表失败'
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
        message: '获取标签详情成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取标签详情失败'
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
          description: null,
          color: tag.color,
          postCount: 0,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        },
        message: '创建标签成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '创建标签失败'
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
          description: null,
          color: tag.color,
          postCount: 0, // 需要重新计算
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        },
        message: '更新标签成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '更新标签失败'
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
        message: '删除标签成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '删除标签失败'
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
        message: '获取标签文章成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || '获取标签文章失败'
      };
    }
  }
}
