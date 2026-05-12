import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { BanVideoDto } from './dto/ban-video.dto';
import { AdminGuard } from './guards/admin.guard';

type AdminRequest = {
  user: {
    userId: string;
    email: string;
  };
};

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('me')
  getMe(@Req() req: AdminRequest) {
    return {
      isAdmin: true,
      email: req.user.email,
    };
  }

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/ban')
  banUser(
    @Param('id') id: string,
    @Body() dto: BanVideoDto,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.banUser(id, dto, req.user.userId);
  }

  @Patch('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  @Get('videos')
  listVideos() {
    return this.adminService.listVideos();
  }

  @Patch('videos/:id/ban')
  banVideo(@Param('id') id: string, @Body() dto: BanVideoDto) {
    return this.adminService.banVideo(id, dto);
  }

  @Patch('videos/:id/unban')
  unbanVideo(@Param('id') id: string) {
    return this.adminService.unbanVideo(id);
  }
}
