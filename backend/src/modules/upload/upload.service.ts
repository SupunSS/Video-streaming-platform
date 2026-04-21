import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  getFileUrl(file: Express.Multer.File, type: 'video' | 'thumbnail'): string {
    return `/uploads/${type}s/${file.filename}`;
  }
}
