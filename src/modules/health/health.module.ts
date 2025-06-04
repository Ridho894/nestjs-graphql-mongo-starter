import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthResolver } from './health.resolver';
import { HealthService } from './health.service';

@Module({
  imports: [TerminusModule, MongooseModule.forFeature([])],
  providers: [HealthResolver, HealthService],
})
export class HealthModule {}
