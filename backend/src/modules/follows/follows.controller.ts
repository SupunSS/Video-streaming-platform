import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':targetId')
  follow(@Request() req, @Param('targetId') targetId: string) {
    return this.followsService.follow(req.user.sub, targetId);
  }

  @Delete(':targetId')
  unfollow(@Request() req, @Param('targetId') targetId: string) {
    return this.followsService.unfollow(req.user.sub, targetId);
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
