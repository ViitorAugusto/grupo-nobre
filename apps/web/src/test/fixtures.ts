import type { Meta, Opportunity, OpportunityDetail, Seller, Stage } from '@/shared/api/types';

export const sellers: Record<'ana' | 'bruno' | 'carla', Seller> = {
  ana: { id: 'seller-ana', name: 'Ana' },
  bruno: { id: 'seller-bruno', name: 'Bruno' },
  carla: { id: 'seller-carla', name: 'Carla' },
};

export const meta: Meta = {
  referenceDate: '2026-10-15',
  parameters: { noContactDays: 5, eventWindowDays: 7 },
  stages: [
    { code: 'PRIMEIRO_CONTATO', label: 'Primeiro Contato', order: 1, isFinal: false },
    {
      code: 'APRESENTACAO_ORCAMENTO',
      label: 'Apresentação de Orçamento',
      order: 2,
      isFinal: false,
    },
    { code: 'FOLLOW_UP', label: 'Follow-up', order: 3, isFinal: false },
    { code: 'FORECAST', label: 'Forecast', order: 4, isFinal: false },
    { code: 'FECHAMENTO', label: 'Fechamento', order: 5, isFinal: true },
    { code: 'PERDIDA', label: 'Perdida', order: 6, isFinal: true },
  ],
  lossReasons: [
    { code: 'PRECO', label: 'Preço', requiresText: false },
    { code: 'PRAZO', label: 'Prazo', requiresText: false },
    { code: 'CONCORRENCIA', label: 'Concorrência', requiresText: false },
    { code: 'CLIENTE_DESISTIU', label: 'Cliente desistiu', requiresText: false },
    { code: 'SEM_RESPOSTA', label: 'Sem resposta', requiresText: false },
    { code: 'OUTRO', label: 'Outro', requiresText: true },
  ],
};

type Base = Pick<Opportunity, 'code' | 'company' | 'seller' | 'stage' | 'estimatedValue'> &
  Partial<Opportunity> & { product: string; quantity: number };

function build({ product, quantity, ...fields }: Base): Opportunity {
  const isFinal = fields.stage === 'FECHAMENTO' || fields.stage === 'PERDIDA';
  return {
    id: fields.code.toLowerCase(),
    isFinal,
    items: [{ id: `${fields.code}-item`, product, quantity }],
    lastContactDate: null,
    proposalValidUntil: null,
    eventDate: null,
    daysWithoutContact: null,
    lossReason: null,
    lossReasonText: null,
    attention: { needsAttention: false, reasons: [] },
    allowedTransitions: [],
    ...fields,
  };
}

const opp2001 = build({
  code: 'OPP-2001',
  company: 'Tech Alpha Ltda',
  product: 'Caneca personalizada',
  quantity: 300,
  estimatedValue: 4500,
  seller: sellers.ana,
  stage: 'PRIMEIRO_CONTATO',
  lastContactDate: '2026-10-14',
  eventDate: '2026-11-30',
  daysWithoutContact: 1,
  allowedTransitions: ['APRESENTACAO_ORCAMENTO', 'PERDIDA'],
});

const opp2002 = build({
  code: 'OPP-2002',
  company: 'Construtora Horizonte',
  product: 'Kit escritório',
  quantity: 120,
  estimatedValue: 9800,
  seller: sellers.bruno,
  stage: 'APRESENTACAO_ORCAMENTO',
  lastContactDate: '2026-10-06',
  proposalValidUntil: '2026-10-13',
  eventDate: '2026-10-25',
  daysWithoutContact: 9,
  attention: {
    needsAttention: true,
    reasons: [
      { rule: 'A1', code: 'PROPOSTA_VENCIDA', message: 'Proposta vencida há 2 dias', days: 2 },
      { rule: 'A2', code: 'SEM_CONTATO', message: '9 dias sem contato', days: 9 },
    ],
  },
  allowedTransitions: ['FOLLOW_UP', 'PERDIDA'],
});

const opp2003 = build({
  code: 'OPP-2003',
  company: 'Clínica Vida',
  product: 'Squeeze personalizado',
  quantity: 500,
  estimatedValue: 7200,
  seller: sellers.ana,
  stage: 'FOLLOW_UP',
  lastContactDate: '2026-10-13',
  proposalValidUntil: '2026-10-20',
  eventDate: '2026-10-18',
  daysWithoutContact: 2,
  attention: {
    needsAttention: true,
    reasons: [
      { rule: 'A3', code: 'EVENTO_PROXIMO', message: 'Evento em 3 dias', days: 3 },
      { rule: 'A4', code: 'VALIDADE_APOS_EVENTO', message: 'Validade após o evento', days: null },
    ],
  },
  allowedTransitions: ['APRESENTACAO_ORCAMENTO', 'FORECAST', 'PERDIDA'],
});

const opp2004 = build({
  code: 'OPP-2004',
  company: 'Agência Pulso',
  product: 'Camiseta estampada',
  quantity: 80,
  estimatedValue: 3900,
  seller: sellers.carla,
  stage: 'FOLLOW_UP',
  lastContactDate: '2026-10-02',
  proposalValidUntil: '2026-10-10',
  eventDate: '2026-11-05',
  daysWithoutContact: 13,
  attention: {
    needsAttention: true,
    reasons: [
      { rule: 'A1', code: 'PROPOSTA_VENCIDA', message: 'Proposta vencida há 5 dias', days: 5 },
      { rule: 'A2', code: 'SEM_CONTATO', message: '13 dias sem contato', days: 13 },
    ],
  },
  allowedTransitions: ['APRESENTACAO_ORCAMENTO', 'FORECAST', 'PERDIDA'],
});

const opp2005 = build({
  code: 'OPP-2005',
  company: 'Banco Norte',
  product: 'Agenda executiva',
  quantity: 1000,
  estimatedValue: 38000,
  seller: sellers.bruno,
  stage: 'FORECAST',
  lastContactDate: '2026-10-15',
  proposalValidUntil: '2026-10-22',
  eventDate: '2026-12-12',
  daysWithoutContact: 0,
  allowedTransitions: ['APRESENTACAO_ORCAMENTO', 'FOLLOW_UP', 'FECHAMENTO', 'PERDIDA'],
});

const opp2006 = build({
  code: 'OPP-2006',
  company: 'Escola Saber',
  product: 'Mochila infantil',
  quantity: 250,
  estimatedValue: 11500,
  seller: sellers.carla,
  stage: 'FECHAMENTO',
  lastContactDate: '2026-10-09',
  proposalValidUntil: '2026-10-16',
  eventDate: '2026-10-17',
  daysWithoutContact: 6,
});

const opp2007 = build({
  code: 'OPP-2007',
  company: 'Padaria do Bairro',
  product: 'Caneta promocional',
  quantity: 50,
  estimatedValue: 350,
  seller: sellers.ana,
  stage: 'PERDIDA',
  lastContactDate: '2026-10-01',
  proposalValidUntil: '2026-10-08',
  eventDate: '2026-10-20',
  daysWithoutContact: 14,
  lossReason: 'NAO_REGISTRADO',
});

export function seedOpportunities(): Opportunity[] {
  return structuredClone([opp2001, opp2002, opp2003, opp2004, opp2005, opp2006, opp2007]);
}

export function toDetail(opportunity: Opportunity): OpportunityDetail {
  return { ...structuredClone(opportunity), history: [] };
}

export function movedTo(opportunity: Opportunity, toStage: Stage): OpportunityDetail {
  return {
    ...toDetail(opportunity),
    stage: toStage,
    isFinal: toStage === 'FECHAMENTO' || toStage === 'PERDIDA',
    allowedTransitions: [],
    history: [
      {
        id: 'history-1',
        fromStage: opportunity.stage,
        toStage,
        lossReason: null,
        lossReasonText: null,
        changedAt: '2026-10-20T18:45:00.000Z',
      },
    ],
  };
}
