import { ServiceUnavailableException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let ping: jest.Mock;
  let connection: {
    readyState: number;
    db?: {
      admin: jest.Mock;
    };
  };

  beforeEach(async () => {
    ping = jest.fn().mockResolvedValue({ ok: 1 });
    connection = {
      readyState: 1,
      db: {
        admin: jest.fn(() => ({ ping })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: getConnectionToken(), useValue: connection },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('returns API liveness without checking the database', () => {
    const health = service.getLiveness();

    expect(health.status).toBe('ok');
    expect(health.service).toBe('flux-backend');
    expect(health.checks).toEqual({ api: 'ok' });
    expect(ping).not.toHaveBeenCalled();
  });

  it('returns readiness when MongoDB responds', async () => {
    const health = await service.getReadiness();

    expect(health.status).toBe('ok');
    expect(health.checks).toEqual({ api: 'ok', database: 'ok' });
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('throws a service unavailable response when MongoDB is disconnected', async () => {
    connection.readyState = 0;

    await expect(service.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    await service.getReadiness().catch((error: ServiceUnavailableException) => {
      expect(error.getStatus()).toBe(503);
      expect(error.getResponse()).toMatchObject({
        status: 'error',
        checks: { api: 'ok', database: 'error' },
      });
    });
  });

  it('reports the current MongoDB connection state', () => {
    expect(service.getDatabaseState()).toBe('connected');

    connection.readyState = 3;

    expect(service.getDatabaseState()).toBe('disconnecting');
  });
});
