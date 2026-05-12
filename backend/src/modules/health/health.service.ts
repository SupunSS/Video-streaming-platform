import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

type HealthStatus = 'ok' | 'error';

type HealthPayload = {
  status: HealthStatus;
  service: string;
  timestamp: string;
  uptime: number;
  checks: Record<string, HealthStatus>;
};

const MONGOOSE_READY_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

@Injectable()
export class HealthService {
  private readonly serviceName = 'flux-backend';

  constructor(@InjectConnection() private readonly connection: Connection) {}

  getLiveness(): HealthPayload {
    return this.createPayload({ api: 'ok' });
  }

  async getReadiness(): Promise<HealthPayload> {
    const databaseStatus = await this.checkDatabase();
    const payload = this.createPayload({
      api: 'ok',
      database: databaseStatus,
    });

    if (databaseStatus !== 'ok') {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }

  private createPayload(checks: Record<string, HealthStatus>): HealthPayload {
    const hasError = Object.values(checks).some((status) => status !== 'ok');

    return {
      status: hasError ? 'error' : 'ok',
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      uptime: Number(process.uptime().toFixed(3)),
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthStatus> {
    if (this.connection.readyState !== 1 || !this.connection.db) {
      return 'error';
    }

    try {
      await this.connection.db.admin().ping();
      return 'ok';
    } catch {
      return 'error';
    }
  }

  getDatabaseState(): string {
    return (
      MONGOOSE_READY_STATES[this.connection.readyState] ??
      `unknown:${this.connection.readyState}`
    );
  }
}
