import { randomUUID } from 'node:crypto';
import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import {
  type OpportunityFilter,
  OpportunityRepository,
} from '../application/opportunity.repository.js';
import type {
  NewStageHistoryEntry,
  Opportunity,
  StageHistoryEntry,
} from '../domain/opportunity.js';
import { stageChangedError } from '../domain/opportunity-errors.js';
import type { Stage } from '../domain/stage.js';

export class InMemoryOpportunityRepository extends OpportunityRepository {
  private opportunities = new Map<string, Opportunity>();
  private history: (StageHistoryEntry & { opportunityId: string })[] = [];
  failOnHistory = false;
  writes = 0;
  private pendingConcurrentStage: Stage | null = null;

  constructor(initial: Opportunity[] = []) {
    super();
    for (const opportunity of initial)
      this.opportunities.set(opportunity.id, structuredClone(opportunity));
  }

  findMany(filter: OpportunityFilter): Promise<Opportunity[]> {
    return Promise.resolve(
      [...this.opportunities.values()]
        .filter((o) => !filter.sellerId || o.seller.id === filter.sellerId)
        .filter((o) => !filter.stage || o.stage === filter.stage)
        .map((o) => structuredClone(o)),
    );
  }

  simulateConcurrentChange(stage: Stage): void {
    this.pendingConcurrentStage = stage;
  }

  findById(id: string): Promise<Opportunity | null> {
    const found = this.opportunities.get(id);
    const read = found ? structuredClone(found) : null;
    if (found && this.pendingConcurrentStage) {
      found.stage = this.pendingConcurrentStage;
      this.pendingConcurrentStage = null;
    }
    return Promise.resolve(read);
  }

  findHistory(opportunityId: string): Promise<StageHistoryEntry[]> {
    return Promise.resolve(
      this.history
        .filter((entry) => entry.opportunityId === opportunityId)
        .map(({ id, fromStage, toStage, lossReason, lossReasonText, changedAt }) => ({
          id,
          fromStage,
          toStage,
          lossReason,
          lossReasonText,
          changedAt,
        })),
    );
  }

  saveStageChange(opportunity: Opportunity, entry: NewStageHistoryEntry): Promise<void> {
    const current = this.opportunities.get(opportunity.id)!;
    if (current.stage !== entry.fromStage) {
      return Promise.reject(stageChangedError(entry.fromStage, current.stage));
    }
    const nextOpportunity = structuredClone(opportunity);
    if (this.failOnHistory) return Promise.reject(new Error('falha ao gravar histórico'));
    const nextEntry = {
      ...entry,
      id: randomUUID(),
      opportunityId: opportunity.id,
      changedAt: new Date(0),
    };
    this.opportunities.set(opportunity.id, nextOpportunity);
    this.history.push(nextEntry);
    this.writes++;
    return Promise.resolve();
  }

  saveLastContact(opportunityId: string, date: CalendarDate): Promise<void> {
    const found = this.opportunities.get(opportunityId);
    if (found) found.lastContactDate = date;
    this.writes++;
    return Promise.resolve();
  }

  saveCommercialData(
    opportunity: Opportunity,
    { replaceItems }: { replaceItems: boolean },
  ): Promise<void> {
    const items = replaceItems
      ? opportunity.items
      : (this.opportunities.get(opportunity.id)?.items ?? []);
    this.opportunities.set(opportunity.id, structuredClone({ ...opportunity, items }));
    this.writes++;
    return Promise.resolve();
  }
}
