import { Injectable } from '@nestjs/common';
import { opportunityNotFound } from '../domain/opportunity-errors.js';
import { decideStageChange, type StageChangeRequest } from '../domain/stage-change.js';
import { GetOpportunityUseCase } from './get-opportunity.use-case.js';
import { OpportunityRepository } from './opportunity.repository.js';
import type { OpportunityDetailView } from './opportunity-views.js';

@Injectable()
export class ChangeStageUseCase {
  constructor(
    private readonly repository: OpportunityRepository,
    private readonly getOpportunity: GetOpportunityUseCase,
  ) {}

  async execute(id: string, request: StageChangeRequest): Promise<OpportunityDetailView> {
    const opportunity = await this.repository.findById(id);
    if (!opportunity) throw opportunityNotFound(id);

    const decision = decideStageChange(opportunity, request);
    if (decision.kind === 'changed') {
      await this.repository.saveStageChange(decision.opportunity, decision.historyEntry);
    }
    return this.getOpportunity.execute(id);
  }
}
