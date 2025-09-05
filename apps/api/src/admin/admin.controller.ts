import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
}
