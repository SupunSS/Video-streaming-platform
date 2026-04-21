import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadService } from './upload.service';

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
  @UseInterceptors(FileInterceptor('file', { storage: storage('videos') }))
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/videos/${file.filename}` };
  }

  @Post('thumbnail')
  @UseInterceptors(FileInterceptor('file', { storage: storage('thumbnails') }))
  uploadThumbnail(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/thumbnails/${file.filename}` };
  }
}
