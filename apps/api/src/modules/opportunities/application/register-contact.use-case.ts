import { Injectable } from '@nestjs/common';
import { ReferenceDateProvider } from '../../../shared/domain/reference-date.js';
import { registerContact } from '../domain/contact.js';
import { opportunityNotFound } from '../domain/opportunity-errors.js';
import { GetOpportunityUseCase } from './get-opportunity.use-case.js';
import { OpportunityRepository } from './opportunity.repository.js';
import type { OpportunityDetailView } from './opportunity-views.js';

@Injectable()
export class RegisterContactUseCase {
  constructor(
    private readonly repository: OpportunityRepository,
    private readonly referenceDate: ReferenceDateProvider,
    private readonly getOpportunity: GetOpportunityUseCase,
  ) {}

  async execute(id: string): Promise<OpportunityDetailView> {
    const opportunity = await this.repository.findById(id);
    if (!opportunity) throw opportunityNotFound(id);

    const updated = registerContact(opportunity, this.referenceDate.today());
    if (updated?.lastContactDate) {
      await this.repository.saveLastContact(id, updated.lastContactDate);
    }
    return this.getOpportunity.execute(id);
  }
}
