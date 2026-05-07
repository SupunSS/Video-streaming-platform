import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Video, VideoSchema } from '../video/schemas/video.schema';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment, CommentSchema } from './schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Video.name, schema: VideoSchema },
    ]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
