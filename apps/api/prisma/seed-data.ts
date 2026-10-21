import type { PrismaClient } from '../src/generated/prisma/client.js';
import { parseCalendarDate, toUtcDate } from '../src/shared/domain/calendar-date.js';
import type { LossReason } from '../src/modules/opportunities/domain/loss-reason.js';
import type { Stage } from '../src/modules/opportunities/domain/stage.js';

export const SEED_SELLERS = ['Ana', 'Bruno', 'Carla'] as const;
type SellerName = (typeof SEED_SELLERS)[number];

interface SeedOpportunity {
  code: string;
  company: string;
  product: string;
  quantity: number;
  estimatedValue: number;
  seller: SellerName;
  lastContactDate: string;
  proposalValidUntil: string | null;
  eventDate: string;
  stage: Stage;
  lossReason?: LossReason;
}

export const SEED_OPPORTUNITIES: readonly SeedOpportunity[] = [
  {
    code: 'OPP-2001',
    company: 'Tech Alpha Ltda',
    product: 'Caneca personalizada',
    quantity: 300,
    estimatedValue: 4500,
    seller: 'Ana',
    lastContactDate: '2026-10-14',
    proposalValidUntil: null,
    eventDate: '2026-11-30',
    stage: 'PRIMEIRO_CONTATO',
  },
  {
    code: 'OPP-2002',
    company: 'Construtora Horizonte',
    product: 'Kit escritório',
    quantity: 120,
    estimatedValue: 9800,
    seller: 'Bruno',
    lastContactDate: '2026-10-06',
    proposalValidUntil: '2026-10-13',
    eventDate: '2026-10-25',
    stage: 'APRESENTACAO_ORCAMENTO',
  },
  {
    code: 'OPP-2003',
    company: 'Clínica Vida',
    product: 'Squeeze personalizado',
    quantity: 500,
    estimatedValue: 7200,
    seller: 'Ana',
    lastContactDate: '2026-10-13',
    proposalValidUntil: '2026-10-20',
    eventDate: '2026-10-18',
    stage: 'FOLLOW_UP',
  },
  {
    code: 'OPP-2004',
    company: 'Agência Pulso',
    product: 'Camiseta estampada',
    quantity: 80,
    estimatedValue: 3900,
    seller: 'Carla',
    lastContactDate: '2026-10-02',
    proposalValidUntil: '2026-10-10',
    eventDate: '2026-11-05',
    stage: 'FOLLOW_UP',
  },
  {
    code: 'OPP-2005',
    company: 'Banco Norte',
    product: 'Agenda executiva',
    quantity: 1000,
    estimatedValue: 38000,
    seller: 'Bruno',
    lastContactDate: '2026-10-15',
    proposalValidUntil: '2026-10-22',
    eventDate: '2026-12-12',
    stage: 'FORECAST',
  },
  {
    code: 'OPP-2006',
    company: 'Escola Saber',
    product: 'Mochila infantil',
    quantity: 250,
    estimatedValue: 11500,
    seller: 'Carla',
    lastContactDate: '2026-10-09',
    proposalValidUntil: '2026-10-16',
    eventDate: '2026-10-17',
    stage: 'FECHAMENTO',
  },
  {
    code: 'OPP-2007',
    company: 'Padaria do Bairro',
    product: 'Caneta promocional',
    quantity: 50,
    estimatedValue: 350,
    seller: 'Ana',
    lastContactDate: '2026-10-01',
    proposalValidUntil: '2026-10-08',
    eventDate: '2026-10-20',
    stage: 'PERDIDA',
    lossReason: 'NAO_REGISTRADO',
  },
];

function date(value: string | null): Date | null {
  return value === null ? null : toUtcDate(parseCalendarDate(value));
}

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.followUpRun.deleteMany();
    await tx.stageHistory.deleteMany();
    await tx.opportunityItem.deleteMany();
    await tx.opportunity.deleteMany();
    await tx.seller.deleteMany();

    const sellerIds = new Map<string, string>();
    for (const name of SEED_SELLERS) {
      const seller = await tx.seller.create({ data: { name } });
      sellerIds.set(name, seller.id);
    }

    for (const opp of SEED_OPPORTUNITIES) {
      await tx.opportunity.create({
        data: {
          code: opp.code,
          company: opp.company,
          sellerId: sellerIds.get(opp.seller)!,
          stage: opp.stage,
          estimatedValue: opp.estimatedValue,
          lastContactDate: date(opp.lastContactDate),
          proposalValidUntil: date(opp.proposalValidUntil),
          eventDate: date(opp.eventDate),
          lossReason: opp.lossReason ?? null,
          lossReasonText: null,
          items: { create: [{ product: opp.product, quantity: opp.quantity, position: 0 }] },
        },
      });
    }
  });
}
