import { Injectable } from '@nestjs/common';
import { applyCommercialData, type CommercialDataChanges } from '../domain/commercial-data.js';
import { opportunityNotFound } from '../domain/opportunity-errors.js';
import { GetOpportunityUseCase } from './get-opportunity.use-case.js';
import { OpportunityRepository } from './opportunity.repository.js';
import type { OpportunityDetailView } from './opportunity-views.js';

@Injectable()
export class UpdateOpportunityUseCase {
  constructor(
    private readonly repository: OpportunityRepository,
    private readonly getOpportunity: GetOpportunityUseCase,
  ) {}

  async execute(id: string, changes: CommercialDataChanges): Promise<OpportunityDetailView> {
    const opportunity = await this.repository.findById(id);
    if (!opportunity) throw opportunityNotFound(id);

    const updated = applyCommercialData(opportunity, changes);
    await this.repository.saveCommercialData(updated, {
      replaceItems: changes.items !== undefined,
    });
    return this.getOpportunity.execute(id);
  }
}
