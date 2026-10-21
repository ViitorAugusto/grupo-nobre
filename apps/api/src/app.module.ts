import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module.js';
import { HealthController } from './health/health.controller.js';
import { FollowUpQueueModule } from './modules/follow-up-queue/follow-up-queue.module.js';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module.js';
import { PrismaModule } from './shared/infra/prisma/prisma.module.js';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    OpportunitiesModule,
    FollowUpQueueModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
