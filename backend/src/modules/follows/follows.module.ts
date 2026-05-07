import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from './schemas/follow.schema';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }]),
  ],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
