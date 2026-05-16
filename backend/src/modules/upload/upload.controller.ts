import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

const storage = (folder: string) =>
  diskStorage({
    destination: `./uploads/${folder}`,
    filename: (_, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + extname(file.originalname));
    },
  });

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('video')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', { storage: storage('videos') }))
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/videos/${file.filename}` };
  }

  // 16:9 landscape thumbnail — for video page header
  @Post('thumbnail')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: storage('thumbnails') }))
  uploadThumbnail(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/thumbnails/${file.filename}` };
  }

  // 2:3 portrait poster — for video cards
  @Post('poster')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', { storage: storage('posters') }))
  uploadPoster(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/posters/${file.filename}` };
  }
}
