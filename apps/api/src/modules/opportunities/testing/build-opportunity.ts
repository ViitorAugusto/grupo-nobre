import { type CalendarDate, parseCalendarDate } from '../../../shared/domain/calendar-date.js';
import type { AttentionParameters } from '../domain/attention.js';
import type { Opportunity } from '../domain/opportunity.js';

type Overrides = Partial<
  Omit<Opportunity, 'lastContactDate' | 'proposalValidUntil' | 'eventDate'>
> & {
  lastContactDate?: string | null;
  proposalValidUntil?: string | null;
  eventDate?: string | null;
};

export const TODAY: CalendarDate = parseCalendarDate('2026-10-15');
export const PARAMS: AttentionParameters = { noContactDays: 5, eventWindowDays: 7 };

function date(value: string | null | undefined): CalendarDate | null {
  return value ? parseCalendarDate(value) : null;
}

export function buildOpportunity(overrides: Overrides = {}): Opportunity {
  const { lastContactDate, proposalValidUntil, eventDate, ...rest } = overrides;
  return {
    id: '00000000-0000-4000-8000-000000000001',
    code: 'OPP-9999',
    company: 'Empresa Teste',
    seller: { id: '00000000-0000-4000-8000-0000000000aa', name: 'Ana' },
    stage: 'PRIMEIRO_CONTATO',
    estimatedValue: 1000,
    items: [{ id: '00000000-0000-4000-8000-0000000000b1', product: 'Caneca', quantity: 10 }],
    lossReason: null,
    lossReasonText: null,
    ...rest,
    lastContactDate: date(lastContactDate),
    proposalValidUntil: date(proposalValidUntil),
    eventDate: date(eventDate),
  };
}
