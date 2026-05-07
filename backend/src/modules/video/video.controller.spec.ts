import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

describe('VideoController', () => {
  let controller: VideoController;
  const videoService = {
    createVideo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [{ provide: VideoService, useValue: videoService }],
    }).compile();

    controller = module.get<VideoController>(VideoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
