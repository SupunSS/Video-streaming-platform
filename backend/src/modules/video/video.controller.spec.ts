import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
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
      providers: [
        { provide: VideoService, useValue: videoService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<VideoController>(VideoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
