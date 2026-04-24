import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StudioGuard } from '../auth/guards/studio.guard';
import { CreateVideoDto } from './dto/create-video.dto';
import { RateVideoDto } from './dto/rate-video.dto';
import { VideoService } from './video.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    username: string; // ✅ added
    accountType: string;
  };
};

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @UseGuards(JwtAuthGuard, StudioGuard)
  @Post()
  create(
    @Body() createVideoDto: CreateVideoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.videoService.create(createVideoDto, req.user); // req.user now includes username
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

  @UseGuards(JwtAuthGuard)
  @Patch(':id/rating')
  rateVideo(
    @Param('id') id: string,
    @Body() rateVideoDto: RateVideoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.videoService.rateVideo(id, req.user.userId, rateVideoDto.value);
  }
}
