export type CalendarDate = string & { readonly __brand: 'CalendarDate' };

const FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function isCalendarDate(value: string): value is CalendarDate {
  const match = FORMAT.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function parseCalendarDate(value: string): CalendarDate {
  if (!isCalendarDate(value)) {
    throw new Error(`Data inválida: "${value}". Formato esperado: AAAA-MM-DD.`);
  }
  return value;
}

export function diffInDays(from: CalendarDate, to: CalendarDate): number {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromUtcDate(new Date(toUtcDate(date).getTime() + days * MS_PER_DAY));
}

export function toUtcDate(date: CalendarDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function fromUtcDate(date: Date): CalendarDate {
  return date.toISOString().slice(0, 10) as CalendarDate;
}
