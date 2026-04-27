import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
  };
};

@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':targetId')
  follow(
    @Req() req: AuthenticatedRequest,
    @Param('targetId') targetId: string,
  ) {
    return this.followsService.follow(req.user.userId, targetId);
  }

  @Delete(':targetId')
  unfollow(
    @Req() req: AuthenticatedRequest,
    @Param('targetId') targetId: string,
  ) {
    return this.followsService.unfollow(req.user.userId, targetId);
  }

  @Get(':userId/followers')
  getFollowers(@Param('userId') userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Get(':userId/following')
  getFollowing(@Param('userId') userId: string) {
    return this.followsService.getFollowing(userId);
  }
}
