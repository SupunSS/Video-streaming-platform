import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { Video, VideoSchema } from './schemas/video.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }]),
  ],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
