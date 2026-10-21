import { Injectable } from '@nestjs/common';
import { ReferenceDateProvider } from '../../../shared/domain/reference-date.js';
import type { Opportunity, StageHistoryEntry } from '../domain/opportunity.js';
import { type OpportunityView, toOpportunityView } from '../domain/opportunity-view.js';
import { AttentionParametersProvider } from './attention-parameters.provider.js';

export interface OpportunityDetailView extends OpportunityView {
  history: StageHistoryEntry[];
}

@Injectable()
export class OpportunityViews {
  constructor(
    private readonly referenceDate: ReferenceDateProvider,
    private readonly attentionParameters: AttentionParametersProvider,
  ) {}

  of(opportunity: Opportunity): OpportunityView {
    return toOpportunityView(
      opportunity,
      this.referenceDate.today(),
      this.attentionParameters.get(),
    );
  }
}
