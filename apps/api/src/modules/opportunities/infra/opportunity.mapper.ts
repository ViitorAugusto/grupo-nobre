import { type CalendarDate, fromUtcDate, toUtcDate } from '../../../shared/domain/calendar-date.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { Opportunity, StageHistoryEntry } from '../domain/opportunity.js';

export const OPPORTUNITY_INCLUDE = {
  seller: true,
  items: { orderBy: { position: 'asc' } },
} as const satisfies Prisma.OpportunityInclude;

type OpportunityRow = Prisma.OpportunityGetPayload<{ include: typeof OPPORTUNITY_INCLUDE }>;
type StageHistoryRow = Prisma.StageHistoryGetPayload<object>;

function toCalendarDate(value: Date | null): CalendarDate | null {
  return value === null ? null : fromUtcDate(value);
}

export function toDbDate(value: CalendarDate | null): Date | null {
  return value === null ? null : toUtcDate(value);
}

export function toOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    code: row.code,
    company: row.company,
    seller: { id: row.seller.id, name: row.seller.name },
    stage: row.stage,
    estimatedValue: row.estimatedValue === null ? null : row.estimatedValue.toNumber(),
    items: row.items.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
    })),
    lastContactDate: toCalendarDate(row.lastContactDate),
    proposalValidUntil: toCalendarDate(row.proposalValidUntil),
    eventDate: toCalendarDate(row.eventDate),
    lossReason: row.lossReason,
    lossReasonText: row.lossReasonText,
  };
}

export function toStageHistoryEntry(row: StageHistoryRow): StageHistoryEntry {
  return {
    id: row.id,
    fromStage: row.fromStage,
    toStage: row.toStage,
    lossReason: row.lossReason,
    lossReasonText: row.lossReasonText,
    changedAt: row.changedAt,
  };
}
