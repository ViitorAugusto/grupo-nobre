const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const instant = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function formatMoney(value: number): string {
  return currency.format(value);
}

export function formatCalendarDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

export function formatInstant(value: string): string {
  return instant.format(new Date(value));
}

export function formatDaysWithoutContact(days: number): string {
  return days === 0 ? 'Contato hoje' : `${pluralize(days, 'dia', 'dias')} sem contato`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
