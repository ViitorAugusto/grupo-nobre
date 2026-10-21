import { Injectable } from '@nestjs/common';
import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import { PrismaService } from '../../../shared/infra/prisma/prisma.service.js';
import {
  type OpportunityFilter,
  OpportunityRepository,
} from '../application/opportunity.repository.js';
import type {
  NewStageHistoryEntry,
  Opportunity,
  StageHistoryEntry,
} from '../domain/opportunity.js';
import { opportunityNotFound, stageChangedError } from '../domain/opportunity-errors.js';
import {
  OPPORTUNITY_INCLUDE,
  toDbDate,
  toOpportunity,
  toStageHistoryEntry,
} from './opportunity.mapper.js';

@Injectable()
export class PrismaOpportunityRepository extends OpportunityRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(filter: OpportunityFilter): Promise<Opportunity[]> {
    const rows = await this.prisma.opportunity.findMany({
      where: { sellerId: filter.sellerId, stage: filter.stage },
      include: OPPORTUNITY_INCLUDE,
    });
    return rows.map(toOpportunity);
  }

  async findById(id: string): Promise<Opportunity | null> {
    const row = await this.prisma.opportunity.findUnique({
      where: { id },
      include: OPPORTUNITY_INCLUDE,
    });
    return row ? toOpportunity(row) : null;
  }

  async findHistory(opportunityId: string): Promise<StageHistoryEntry[]> {
    const rows = await this.prisma.stageHistory.findMany({
      where: { opportunityId },
      orderBy: [{ changedAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toStageHistoryEntry);
  }

  async saveStageChange(opportunity: Opportunity, entry: NewStageHistoryEntry): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.opportunity.updateMany({
        where: { id: opportunity.id, stage: entry.fromStage },
        data: {
          stage: opportunity.stage,
          lossReason: opportunity.lossReason,
          lossReasonText: opportunity.lossReasonText,
        },
      });
      if (count === 0) {
        const current = await tx.opportunity.findUnique({
          where: { id: opportunity.id },
          select: { stage: true },
        });
        if (!current) throw opportunityNotFound(opportunity.id);
        throw stageChangedError(entry.fromStage, current.stage);
      }
      await tx.stageHistory.create({
        data: {
          opportunityId: opportunity.id,
          fromStage: entry.fromStage,
          toStage: entry.toStage,
          lossReason: entry.lossReason,
          lossReasonText: entry.lossReasonText,
        },
      });
    });
  }

  async saveLastContact(opportunityId: string, date: CalendarDate): Promise<void> {
    await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: { lastContactDate: toDbDate(date) },
    });
  }

  async saveCommercialData(
    opportunity: Opportunity,
    { replaceItems }: { replaceItems: boolean },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.opportunity.update({
        where: { id: opportunity.id },
        data: {
          estimatedValue: opportunity.estimatedValue,
          proposalValidUntil: toDbDate(opportunity.proposalValidUntil),
          eventDate: toDbDate(opportunity.eventDate),
        },
      });
      if (!replaceItems) return;
      await tx.opportunityItem.deleteMany({ where: { opportunityId: opportunity.id } });
      await tx.opportunityItem.createMany({
        data: opportunity.items.map((item, position) => ({
          opportunityId: opportunity.id,
          product: item.product,
          quantity: item.quantity,
          position,
        })),
      });
    });
  }
}
