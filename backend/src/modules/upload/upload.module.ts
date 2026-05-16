import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AdminGuard } from '../admin/guards/admin.guard';

@Module({
  controllers: [UploadController],
  providers: [UploadService, AdminGuard],
})
export class UploadModule {}
