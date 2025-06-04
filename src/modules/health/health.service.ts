import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorStatus } from '@nestjs/terminus';

@Injectable()
export class HealthService {
  async checkApiStatus(): Promise<HealthIndicatorResult> {
    const isHealthy = true; // Replace with actual health logic if needed

    const result: HealthIndicatorResult = {
      api: {
        status: isHealthy
          ? ('up' as HealthIndicatorStatus)
          : ('down' as HealthIndicatorStatus),
      },
    };

    return result;
  }
}
