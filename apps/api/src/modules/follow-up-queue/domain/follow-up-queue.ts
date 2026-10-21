import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import {
  type AttentionInput,
  type AttentionParameters,
  type AttentionReason,
  attentionFor,
} from '../../opportunities/domain/attention.js';
import type { Opportunity } from '../../opportunities/domain/opportunity.js';

export type QueueCandidate = AttentionInput &
  Pick<Opportunity, 'id' | 'code' | 'company' | 'seller' | 'estimatedValue'>;

export interface QueueEntry {
  opportunity: QueueCandidate;
  reasons: AttentionReason[];
}

export interface QueueItem extends QueueEntry {
  position: number;
}

export function selectForQueue(
  candidates: readonly QueueCandidate[],
  date: CalendarDate,
  params: AttentionParameters,
): QueueEntry[] {
  return candidates
    .filter((opportunity) => opportunity.lastContactDate !== date)
    .map((opportunity) => ({ opportunity, ...attentionFor(opportunity, date, params) }))
    .filter((entry) => entry.needsAttention)
    .map(({ opportunity, reasons }) => ({ opportunity, reasons }));
}
