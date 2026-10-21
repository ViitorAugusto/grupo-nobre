import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import type { SellerRef } from '../../opportunities/domain/opportunity.js';
import type { QueueCandidate } from '../domain/follow-up-queue.js';

export abstract class QueueCandidateSource {
  abstract findOpen(): Promise<QueueCandidate[]>;
  abstract findByIds(ids: readonly string[]): Promise<QueueCandidate[]>;
}

export interface RunItemRecord {
  opportunityId: string;
  sellerId: string;
  position: number;
}

export interface SummaryRecord {
  seller: SellerRef;
  text: string;
  createdAt: Date;
}

export interface RunRecord {
  date: CalendarDate;
  generatedAt: Date;
  items: RunItemRecord[];
}

export abstract class FollowUpRunRepository {
  abstract replace(
    date: CalendarDate,
    items: readonly RunItemRecord[],
    summaries: readonly { sellerId: string; text: string }[],
  ): Promise<RunRecord>;
  abstract findByDate(date: CalendarDate): Promise<RunRecord | null>;
  abstract findSummaries(date: CalendarDate, sellerId?: string): Promise<SummaryRecord[]>;
}
