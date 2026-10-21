import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import type { LossReason } from './loss-reason.js';
import type { Stage } from './stage.js';

export interface SellerRef {
  id: string;
  name: string;
}

export interface OpportunityItem {
  id?: string;
  product: string;
  quantity: number;
}

export interface Opportunity {
  id: string;
  code: string;
  company: string;
  seller: SellerRef;
  stage: Stage;
  estimatedValue: number | null;
  items: OpportunityItem[];
  lastContactDate: CalendarDate | null;
  proposalValidUntil: CalendarDate | null;
  eventDate: CalendarDate | null;
  lossReason: LossReason | null;
  lossReasonText: string | null;
}

export interface NewStageHistoryEntry {
  fromStage: Stage;
  toStage: Stage;
  lossReason: LossReason | null;
  lossReasonText: string | null;
}

export interface StageHistoryEntry extends NewStageHistoryEntry {
  id: string;
  changedAt: Date;
}

export function createStageHistoryEntry(entry: NewStageHistoryEntry): NewStageHistoryEntry {
  return {
    fromStage: entry.fromStage,
    toStage: entry.toStage,
    lossReason: entry.lossReason ?? null,
    lossReasonText: entry.lossReasonText ?? null,
  };
}
