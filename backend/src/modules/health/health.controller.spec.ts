import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  const healthService = {
    getLiveness: jest.fn(),
    getReadiness: jest.fn(),
    getDatabaseState: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns liveness from /health', () => {
    const response = { status: 'ok' };
    healthService.getLiveness.mockReturnValue(response);

    expect(controller.getLiveness()).toBe(response);
  });

  it('returns liveness from /health/live', () => {
    const response = { status: 'ok' };
    healthService.getLiveness.mockReturnValue(response);

    expect(controller.getLive()).toBe(response);
  });

  it('returns readiness from /health/ready', () => {
    const response = Promise.resolve({ status: 'ok' });
    healthService.getReadiness.mockReturnValue(response);

    expect(controller.getReadiness()).toBe(response);
  });

  it('returns database state from /health/database', () => {
    healthService.getDatabaseState.mockReturnValue('connected');

    expect(controller.getDatabaseState()).toMatchObject({
      status: 'connected',
    });
  });
});
