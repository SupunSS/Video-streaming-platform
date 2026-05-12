import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('live')
  getLive() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('database')
  getDatabaseState() {
    return {
      status: this.healthService.getDatabaseState(),
      timestamp: new Date().toISOString(),
    };
  }
}
