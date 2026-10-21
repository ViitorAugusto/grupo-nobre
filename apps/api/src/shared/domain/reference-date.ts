import type { CalendarDate } from './calendar-date.js';

export abstract class ReferenceDateProvider {
  abstract today(): CalendarDate;
}
