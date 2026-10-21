import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import {
  type Attention,
  type AttentionParameters,
  attentionFor,
  daysWithoutContact,
} from './attention.js';
import type { Opportunity } from './opportunity.js';
import { type Stage, stageOrder } from './stage.js';
import { allowedTransitionsFrom } from './stage-transition.js';

export interface OpportunityView {
  opportunity: Opportunity;
  attention: Attention;
  daysWithoutContact: number | null;
  allowedTransitions: Stage[];
}

export function toOpportunityView(
  opportunity: Opportunity,
  today: CalendarDate,
  params: AttentionParameters,
): OpportunityView {
  return {
    opportunity,
    attention: attentionFor(opportunity, today, params),
    daysWithoutContact: daysWithoutContact(opportunity, today),
    allowedTransitions: allowedTransitionsFrom(opportunity.stage),
  };
}

export function matchesSearch(opportunity: Opportunity, search: string): boolean {
  const term = normalize(search.trim());
  return (
    normalize(opportunity.code).includes(term) || normalize(opportunity.company).includes(term)
  );
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

export function compareForBoard(a: OpportunityView, b: OpportunityView): number {
  return (
    stageOrder(a.opportunity.stage) - stageOrder(b.opportunity.stage) ||
    Number(b.attention.needsAttention) - Number(a.attention.needsAttention) ||
    compareEventDate(a.opportunity.eventDate, b.opportunity.eventDate) ||
    a.opportunity.code.localeCompare(b.opportunity.code)
  );
}

function compareEventDate(a: CalendarDate | null, b: CalendarDate | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
}
