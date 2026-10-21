import { Injectable } from '@nestjs/common';
import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import { ReferenceDateProvider } from '../../../shared/domain/reference-date.js';
import { AttentionParametersProvider } from '../../opportunities/application/attention-parameters.provider.js';
import { SellerRepository } from '../../opportunities/application/opportunity.repository.js';
import type { SellerRef } from '../../opportunities/domain/opportunity.js';
import { dailySummaryText } from '../domain/daily-summary.js';
import { selectForQueue } from '../domain/follow-up-queue.js';
import { rankQueue } from '../domain/queue-priority.js';
import { FollowUpRunRepository, QueueCandidateSource } from './follow-up-queue.ports.js';

export interface QueueRunView {
  date: CalendarDate;
  generatedAt: Date;
  sellers: { seller: SellerRef; itemCount: number }[];
}

@Injectable()
export class GenerateFollowUpQueueUseCase {
  constructor(
    private readonly candidates: QueueCandidateSource,
    private readonly sellers: SellerRepository,
    private readonly runs: FollowUpRunRepository,
    private readonly referenceDate: ReferenceDateProvider,
    private readonly attentionParameters: AttentionParametersProvider,
  ) {}

  async execute(date: CalendarDate = this.referenceDate.today()): Promise<QueueRunView> {
    const entries = selectForQueue(
      await this.candidates.findOpen(),
      date,
      this.attentionParameters.get(),
    );
    const sellers = await this.sellers.findAll();

    const queues = sellers.map((seller) => ({
      seller,
      items: rankQueue(entries.filter((entry) => entry.opportunity.seller.id === seller.id)),
    }));
    const items = queues.flatMap(({ seller, items }) =>
      items.map((item) => ({
        opportunityId: item.opportunity.id,
        sellerId: seller.id,
        position: item.position,
      })),
    );
    const summaries = queues.flatMap(({ seller, items }) => {
      const text = dailySummaryText(seller.name, date, items);
      return text === null ? [] : [{ sellerId: seller.id, text }];
    });

    const run = await this.runs.replace(date, items, summaries);
    return {
      date,
      generatedAt: run.generatedAt,
      sellers: queues.map(({ seller, items }) => ({ seller, itemCount: items.length })),
    };
  }
}
