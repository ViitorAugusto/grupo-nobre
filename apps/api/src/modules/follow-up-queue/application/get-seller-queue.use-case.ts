import { Injectable } from '@nestjs/common';
import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import { NotFoundError } from '../../../shared/domain/domain-error.js';
import { ReferenceDateProvider } from '../../../shared/domain/reference-date.js';
import { AttentionParametersProvider } from '../../opportunities/application/attention-parameters.provider.js';
import { SellerRepository } from '../../opportunities/application/opportunity.repository.js';
import type { SellerRef } from '../../opportunities/domain/opportunity.js';
import { type QueueItem, selectForQueue } from '../domain/follow-up-queue.js';
import { rankQueue } from '../domain/queue-priority.js';
import { FollowUpRunRepository, QueueCandidateSource } from './follow-up-queue.ports.js';

export interface SellerQueueView {
  date: CalendarDate;
  seller: SellerRef;
  generatedAt: Date | null;
  items: QueueItem[];
}

@Injectable()
export class GetSellerQueueUseCase {
  constructor(
    private readonly candidates: QueueCandidateSource,
    private readonly sellers: SellerRepository,
    private readonly runs: FollowUpRunRepository,
    private readonly referenceDate: ReferenceDateProvider,
    private readonly attentionParameters: AttentionParametersProvider,
  ) {}

  async execute(
    sellerId: string,
    date: CalendarDate = this.referenceDate.today(),
  ): Promise<SellerQueueView> {
    const seller = (await this.sellers.findAll()).find((s) => s.id === sellerId);
    if (!seller) throw new NotFoundError('Vendedor não encontrado.', { sellerId });

    const run = await this.runs.findByDate(date);
    if (!run) return { date, seller, generatedAt: null, items: [] };

    const ids = run.items.filter((item) => item.sellerId === sellerId).map((i) => i.opportunityId);
    const current = (await this.candidates.findByIds(ids)).filter((o) => o.seller.id === sellerId);
    const items = rankQueue(selectForQueue(current, date, this.attentionParameters.get()));
    return { date, seller, generatedAt: run.generatedAt, items };
  }
}
