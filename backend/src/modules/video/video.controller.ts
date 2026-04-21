import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
  };
};

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createVideoDto: CreateVideoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.videoService.create(createVideoDto, req.user);
  }

  @Get()
  findAll() {
    return this.videoService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyVideos(@Req() req: AuthenticatedRequest) {
    return this.videoService.findMyVideos(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.videoService.findOne(id);
  }

  @Patch(':id/views')
  incrementViews(@Param('id') id: string) {
    return this.videoService.incrementViews(id);
  }
}
