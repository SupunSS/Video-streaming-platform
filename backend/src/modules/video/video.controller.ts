import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateVideoDto } from './dto/create-video.dto';
import { RateVideoDto } from './dto/rate-video.dto';
import { VideoService } from './video.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
  };
};

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get()
  getAll() {
    return this.videoService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyVideos(@Req() req: AuthenticatedRequest) {
    return this.videoService.getMyVideos(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/my-rating')
  getMyRating(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.videoService.getMyRating(id, req.user.userId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.videoService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createVideo(@Body() dto: CreateVideoDto, @Req() req: AuthenticatedRequest) {
    if (!dto.videoUrl) {
      throw new BadRequestException('Video file URL is required');
    }

    return this.videoService.createVideo({
      dto,
      ownerId: req.user.userId,
      videoUrl: dto.videoUrl,
      thumbnailUrl: dto.thumbnailUrl || '/uploads/thumbnails/default.jpg',
      posterUrl: dto.posterUrl,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  async uploadVideo(
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
    @Body() dto: CreateVideoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];

    const videoUrl = videoFile ? `/uploads/videos/${videoFile.filename}` : '';
    const thumbnailUrl = thumbnailFile
      ? `/uploads/thumbnails/${thumbnailFile.filename}`
      : '';

    return this.videoService.createVideo({
      dto,
      ownerId: req.user.userId,
      videoUrl,
      thumbnailUrl,
      posterUrl: dto.posterUrl,
    });
  }

  @Patch(':id/views')
  incrementViews(@Param('id') id: string) {
    return this.videoService.incrementViews(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/rating')
  rateVideo(
    @Param('id') id: string,
    @Body() dto: RateVideoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.videoService.rateVideo(id, req.user.userId, dto.value);
  }
}
