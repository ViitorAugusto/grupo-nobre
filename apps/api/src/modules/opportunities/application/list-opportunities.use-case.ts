import { Injectable } from '@nestjs/common';
import {
  compareForBoard,
  matchesSearch,
  type OpportunityView,
} from '../domain/opportunity-view.js';
import type { Stage } from '../domain/stage.js';
import { OpportunityRepository } from './opportunity.repository.js';
import { OpportunityViews } from './opportunity-views.js';

export interface ListOpportunitiesQuery {
  search?: string;
  sellerId?: string;
  stage?: Stage;
  needsAttention?: boolean;
}

@Injectable()
export class ListOpportunitiesUseCase {
  constructor(
    private readonly repository: OpportunityRepository,
    private readonly views: OpportunityViews,
  ) {}

  async execute(query: ListOpportunitiesQuery): Promise<OpportunityView[]> {
    const opportunities = await this.repository.findMany({
      sellerId: query.sellerId,
      stage: query.stage,
    });
    return opportunities
      .filter((opportunity) => !query.search || matchesSearch(opportunity, query.search))
      .map((opportunity) => this.views.of(opportunity))
      .filter(
        (view) =>
          query.needsAttention === undefined ||
          view.attention.needsAttention === query.needsAttention,
      )
      .sort(compareForBoard);
  }
}
