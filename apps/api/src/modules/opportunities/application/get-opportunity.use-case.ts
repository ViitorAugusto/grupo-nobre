import { Injectable } from '@nestjs/common';
import { opportunityNotFound } from '../domain/opportunity-errors.js';
import { OpportunityRepository } from './opportunity.repository.js';
import { type OpportunityDetailView, OpportunityViews } from './opportunity-views.js';

@Injectable()
export class GetOpportunityUseCase {
  constructor(
    private readonly repository: OpportunityRepository,
    private readonly views: OpportunityViews,
  ) {}

  async execute(id: string): Promise<OpportunityDetailView> {
    const opportunity = await this.repository.findById(id);
    if (!opportunity) throw opportunityNotFound(id);
    const history = await this.repository.findHistory(id);
    return { ...this.views.of(opportunity), history };
  }
}
