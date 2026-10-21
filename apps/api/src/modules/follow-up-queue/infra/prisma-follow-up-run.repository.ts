import { Injectable } from '@nestjs/common';
import { type CalendarDate, fromUtcDate, toUtcDate } from '../../../shared/domain/calendar-date.js';
import { PrismaService } from '../../../shared/infra/prisma/prisma.service.js';
import {
  FollowUpRunRepository,
  type RunItemRecord,
  type RunRecord,
  type SummaryRecord,
} from '../application/follow-up-queue.ports.js';

const ITEM_SELECT = { opportunityId: true, sellerId: true, position: true } as const;

@Injectable()
export class PrismaFollowUpRunRepository extends FollowUpRunRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async replace(
    date: CalendarDate,
    items: readonly RunItemRecord[],
    summaries: readonly { sellerId: string; text: string }[],
  ): Promise<RunRecord> {
    const run = await this.prisma.$transaction(async (tx) => {
      await tx.followUpRun.deleteMany({ where: { date: toUtcDate(date) } });
      return tx.followUpRun.create({
        data: {
          date: toUtcDate(date),
          items: { create: items.map((item) => ({ ...item })) },
          summaries: { create: summaries.map((summary) => ({ ...summary })) },
        },
        include: { items: { select: ITEM_SELECT, orderBy: { position: 'asc' } } },
      });
    });
    return { date: fromUtcDate(run.date), generatedAt: run.generatedAt, items: run.items };
  }

  async findByDate(date: CalendarDate): Promise<RunRecord | null> {
    const run = await this.prisma.followUpRun.findUnique({
      where: { date: toUtcDate(date) },
      include: { items: { select: ITEM_SELECT, orderBy: { position: 'asc' } } },
    });
    return run
      ? { date: fromUtcDate(run.date), generatedAt: run.generatedAt, items: run.items }
      : null;
  }

  async findSummaries(date: CalendarDate, sellerId?: string): Promise<SummaryRecord[]> {
    const rows = await this.prisma.followUpSummary.findMany({
      where: { sellerId, run: { date: toUtcDate(date) } },
      include: { seller: { select: { id: true, name: true } } },
      orderBy: { seller: { name: 'asc' } },
    });
    return rows.map((row) => ({ seller: row.seller, text: row.text, createdAt: row.createdAt }));
  }
}
