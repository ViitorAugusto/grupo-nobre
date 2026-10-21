import { Injectable } from '@nestjs/common';
import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import { ReferenceDateProvider } from '../../../shared/domain/reference-date.js';
import { FollowUpRunRepository, type SummaryRecord } from './follow-up-queue.ports.js';

export interface SummaryView extends SummaryRecord {
  date: CalendarDate;
}

@Injectable()
export class ListSummariesUseCase {
  constructor(
    private readonly runs: FollowUpRunRepository,
    private readonly referenceDate: ReferenceDateProvider,
  ) {}

  async execute(
    date: CalendarDate = this.referenceDate.today(),
    sellerId?: string,
  ): Promise<SummaryView[]> {
    const summaries = await this.runs.findSummaries(date, sellerId);
    return summaries.map((summary) => ({ date, ...summary }));
  }
}
