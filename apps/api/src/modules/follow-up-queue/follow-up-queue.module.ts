import { Module } from '@nestjs/common';
import { OpportunitiesModule } from '../opportunities/opportunities.module.js';
import {
  FollowUpRunRepository,
  QueueCandidateSource,
} from './application/follow-up-queue.ports.js';
import { GenerateFollowUpQueueUseCase } from './application/generate-follow-up-queue.use-case.js';
import { GetSellerQueueUseCase } from './application/get-seller-queue.use-case.js';
import { ListSummariesUseCase } from './application/list-summaries.use-case.js';
import { FollowUpQueueController } from './http/follow-up-queue.controller.js';
import { FollowUpQueueScheduler } from './infra/follow-up-queue.scheduler.js';
import { OpportunityQueueCandidateSource } from './infra/opportunity-queue-candidate.source.js';
import { PrismaFollowUpRunRepository } from './infra/prisma-follow-up-run.repository.js';

@Module({
  imports: [OpportunitiesModule],
  controllers: [FollowUpQueueController],
  providers: [
    { provide: QueueCandidateSource, useClass: OpportunityQueueCandidateSource },
    { provide: FollowUpRunRepository, useClass: PrismaFollowUpRunRepository },
    GenerateFollowUpQueueUseCase,
    GetSellerQueueUseCase,
    ListSummariesUseCase,
    FollowUpQueueScheduler,
  ],
})
export class FollowUpQueueModule {}
