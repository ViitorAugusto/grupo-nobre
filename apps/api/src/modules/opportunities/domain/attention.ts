import { type CalendarDate, diffInDays } from '../../../shared/domain/calendar-date.js';
import type { Opportunity } from './opportunity.js';
import { isFinalStage, type Stage } from './stage.js';

export interface AttentionParameters {
  noContactDays: number;
  eventWindowDays: number;
}

export type AttentionRule = 'A1' | 'A2' | 'A3' | 'A4';

export type AttentionCode =
  'PROPOSTA_VENCIDA' | 'SEM_CONTATO' | 'EVENTO_PROXIMO' | 'VALIDADE_APOS_EVENTO';

export interface AttentionReason {
  rule: AttentionRule;
  code: AttentionCode;
  message: string;
  days: number | null;
}

export interface Attention {
  needsAttention: boolean;
  reasons: AttentionReason[];
}

export type AttentionInput = Pick<
  Opportunity,
  'stage' | 'lastContactDate' | 'proposalValidUntil' | 'eventDate'
>;

type AttentionCheck = (
  opportunity: AttentionInput,
  today: CalendarDate,
  params: AttentionParameters,
) => AttentionReason | null;

const STAGES_WITH_PROPOSAL: readonly Stage[] = ['APRESENTACAO_ORCAMENTO', 'FOLLOW_UP', 'FORECAST'];

function days(count: number): string {
  return `${count} ${count === 1 ? 'dia' : 'dias'}`;
}

const eventSoon: AttentionCheck = ({ eventDate }, today, { eventWindowDays }) => {
  if (eventDate === null) return null;
  const until = diffInDays(today, eventDate);
  if (until > eventWindowDays) return null;
  return { rule: 'A3', code: 'EVENTO_PROXIMO', message: eventMessage(until), days: until };
};

function eventMessage(until: number): string {
  if (until < 0) return `Evento já passou há ${days(-until)}`;
  if (until === 0) return 'Evento hoje';
  if (until === 1) return 'Evento amanhã';
  return `Evento em ${days(until)}`;
}

const expiredProposal: AttentionCheck = ({ stage, proposalValidUntil }, today) => {
  if (proposalValidUntil === null || !STAGES_WITH_PROPOSAL.includes(stage)) return null;
  const since = diffInDays(proposalValidUntil, today);
  if (since <= 0) return null;
  return {
    rule: 'A1',
    code: 'PROPOSTA_VENCIDA',
    message: `Proposta vencida há ${days(since)}`,
    days: since,
  };
};

const validityAfterEvent: AttentionCheck = ({ proposalValidUntil, eventDate }) => {
  if (proposalValidUntil === null || eventDate === null) return null;
  if (diffInDays(eventDate, proposalValidUntil) <= 0) return null;
  return {
    rule: 'A4',
    code: 'VALIDADE_APOS_EVENTO',
    message: 'Validade após o evento',
    days: null,
  };
};

const noRecentContact: AttentionCheck = ({ lastContactDate }, today, { noContactDays }) => {
  if (lastContactDate === null) return null;
  const since = diffInDays(lastContactDate, today);
  if (since <= noContactDays) return null;
  return { rule: 'A2', code: 'SEM_CONTATO', message: `${days(since)} sem contato`, days: since };
};

const CHECKS: readonly AttentionCheck[] = [
  eventSoon,
  expiredProposal,
  validityAfterEvent,
  noRecentContact,
];

export const ATTENTION_PRIORITY: readonly AttentionRule[] = ['A3', 'A1', 'A4', 'A2'];

export function attentionFor(
  opportunity: AttentionInput,
  today: CalendarDate,
  params: AttentionParameters,
): Attention {
  if (isFinalStage(opportunity.stage)) return { needsAttention: false, reasons: [] };
  const reasons = CHECKS.map((check) => check(opportunity, today, params)).filter(
    (reason): reason is AttentionReason => reason !== null,
  );
  return { needsAttention: reasons.length > 0, reasons };
}

export function daysWithoutContact(
  opportunity: Pick<Opportunity, 'lastContactDate'>,
  today: CalendarDate,
): number | null {
  return opportunity.lastContactDate === null
    ? null
    : diffInDays(opportunity.lastContactDate, today);
}
