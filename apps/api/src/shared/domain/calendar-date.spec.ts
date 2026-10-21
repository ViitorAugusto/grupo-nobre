import {
  addDays,
  diffInDays,
  fromUtcDate,
  isCalendarDate,
  parseCalendarDate,
  toUtcDate,
} from './calendar-date.js';

describe('CalendarDate', () => {
  it('aceita só datas reais no formato AAAA-MM-DD', () => {
    expect(isCalendarDate('2026-10-15')).toBe(true);
    expect(isCalendarDate('2026-02-30')).toBe(false);
    expect(isCalendarDate('15/10/2026')).toBe(false);
    expect(() => parseCalendarDate('2026-13-01')).toThrow('Data inválida');
  });

  it('conta dias corridos entre datas, nos dois sentidos', () => {
    const hoje = parseCalendarDate('2026-10-15');
    expect(diffInDays(parseCalendarDate('2026-10-06'), hoje)).toBe(9);
    expect(diffInDays(hoje, parseCalendarDate('2026-10-18'))).toBe(3);
    expect(diffInDays(hoje, hoje)).toBe(0);
  });

  it('não é afetado por horário de verão ou virada de mês', () => {
    expect(diffInDays(parseCalendarDate('2026-10-31'), parseCalendarDate('2026-11-02'))).toBe(2);
    expect(addDays(parseCalendarDate('2026-12-31'), 1)).toBe('2027-01-01');
  });

  it('converte de e para Date à meia-noite UTC sem perder o dia', () => {
    const data = parseCalendarDate('2026-10-15');
    expect(toUtcDate(data).toISOString()).toBe('2026-10-15T00:00:00.000Z');
    expect(fromUtcDate(toUtcDate(data))).toBe('2026-10-15');
  });
});
