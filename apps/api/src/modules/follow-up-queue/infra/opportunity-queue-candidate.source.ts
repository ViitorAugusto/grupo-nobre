import { Injectable } from '@nestjs/common';
import { OpportunityRepository } from '../../opportunities/application/opportunity.repository.js';
import { isFinalStage } from '../../opportunities/domain/stage.js';
import { QueueCandidateSource } from '../application/follow-up-queue.ports.js';
import type { QueueCandidate } from '../domain/follow-up-queue.js';

@Injectable()
export class OpportunityQueueCandidateSource extends QueueCandidateSource {
  constructor(private readonly opportunities: OpportunityRepository) {
    super();
  }

  async findOpen(): Promise<QueueCandidate[]> {
    const all = await this.opportunities.findMany({});
    return all.filter((opportunity) => !isFinalStage(opportunity.stage));
  }

  async findByIds(ids: readonly string[]): Promise<QueueCandidate[]> {
    if (ids.length === 0) return [];
    const wanted = new Set(ids);
    const all = await this.opportunities.findMany({});
    return all.filter((opportunity) => wanted.has(opportunity.id));
  }
}
