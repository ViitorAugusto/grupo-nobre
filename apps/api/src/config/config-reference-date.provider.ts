import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type CalendarDate, parseCalendarDate } from '../shared/domain/calendar-date.js';
import { ReferenceDateProvider } from '../shared/domain/reference-date.js';
import type { Env } from './env.js';

@Injectable()
export class ConfigReferenceDateProvider extends ReferenceDateProvider {
  private readonly date: CalendarDate;

  constructor(config: ConfigService<Env, true>) {
    super();
    this.date = parseCalendarDate(config.get('REFERENCE_DATE', { infer: true }));
  }

  today(): CalendarDate {
    return this.date;
  }
}
