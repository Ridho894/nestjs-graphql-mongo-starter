import { Query, Resolver } from '@nestjs/graphql';
import { HealthService } from './health.service';
import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

@Resolver('Health')
export class HealthResolver {
  constructor(
    private health: HealthCheckService,
    private mongooseHealth: MongooseHealthIndicator,
    private healthService: HealthService,
  ) {}

  @Query(() => String, { description: 'Health check endpoint' })
  @SkipThrottle()
  async healthCheck() {
    try {
      const healthCheck = await this.health.check([
        () => this.mongooseHealth.pingCheck('mongodb'),
        () => this.healthService.checkApiStatus(),
      ]);

      return JSON.stringify(healthCheck);
    } catch (error) {
      return JSON.stringify({
        status: 'error',
        info: { error: error.message },
      });
    }
  }
}
