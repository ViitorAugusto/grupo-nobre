import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import type { QueueItem } from './follow-up-queue.js';

function formatDate(date: CalendarDate): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function formatValue(value: number | null): string {
  if (value === null) return 'valor não informado';
  const cents = Number.isInteger(value) ? 0 : 2;
  const number = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: cents,
    maximumFractionDigits: cents,
  }).format(value);
  return `R$ ${number}`;
}

export function dailySummaryText(
  sellerName: string,
  date: CalendarDate,
  items: readonly QueueItem[],
): string | null {
  if (items.length === 0) return null;
  const count = items.length === 1 ? '1 retorno' : `${items.length} retornos`;
  const lines = items.map(({ position, opportunity, reasons }) => {
    const why = reasons.map((reason) => reason.message).join('; ');
    return `${position}. ${opportunity.code} · ${opportunity.company} · ${formatValue(opportunity.estimatedValue)} — ${why}`;
  });
  return [`Bom dia, ${sellerName}! Você tem ${count} hoje (${formatDate(date)}):`, ...lines].join(
    '\n',
  );
}
