import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import type {
  NewStageHistoryEntry,
  Opportunity,
  SellerRef,
  StageHistoryEntry,
} from '../domain/opportunity.js';
import type { Stage } from '../domain/stage.js';

export interface OpportunityFilter {
  sellerId?: string;
  stage?: Stage;
}

export abstract class OpportunityRepository {
  abstract findMany(filter: OpportunityFilter): Promise<Opportunity[]>;
  abstract findById(id: string): Promise<Opportunity | null>;
  abstract findHistory(opportunityId: string): Promise<StageHistoryEntry[]>;
  abstract saveStageChange(opportunity: Opportunity, entry: NewStageHistoryEntry): Promise<void>;
  abstract saveLastContact(opportunityId: string, date: CalendarDate): Promise<void>;
  abstract saveCommercialData(
    opportunity: Opportunity,
    options: { replaceItems: boolean },
  ): Promise<void>;
}

export abstract class SellerRepository {
  abstract findAll(): Promise<SellerRef[]>;
}
