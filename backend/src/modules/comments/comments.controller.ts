import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

type AuthenticatedRequest = {
  user: {
    userId: string;
  };
};

@Controller('videos/:videoId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  getForVideo(
    @Param('videoId') videoId: string,
    @Query('sort') sort?: 'top' | 'newest',
  ) {
    return this.commentsService.getForVideo(videoId, sort);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('videoId') videoId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.create(videoId, req.user.userId, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':commentId/like')
  toggleLike(
    @Param('videoId') videoId: string,
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.toggleLike(videoId, commentId, req.user.userId);
  }
}
