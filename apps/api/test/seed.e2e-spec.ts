import { API, createTestApp, resetDatabase, type TestApp } from './support/test-app.js';

const A1 = (days: number) => ({
  rule: 'A1',
  code: 'PROPOSTA_VENCIDA',
  message: `Proposta vencida há ${days} dias`,
  days,
});
const A2 = (days: number) => ({
  rule: 'A2',
  code: 'SEM_CONTATO',
  message: `${days} dias sem contato`,
  days,
});
const A3 = (days: number) => ({
  rule: 'A3',
  code: 'EVENTO_PROXIMO',
  message: `Evento em ${days} dias`,
  days,
});
const A4 = {
  rule: 'A4',
  code: 'VALIDADE_APOS_EVENTO',
  message: 'Validade após o evento',
  days: null,
};

const EXPECTED = [
  {
    code: 'OPP-2001',
    stage: 'PRIMEIRO_CONTATO',
    needsAttention: false,
    reasons: [],
    allowedTransitions: ['APRESENTACAO_ORCAMENTO', 'PERDIDA'],
  },
  {
    code: 'OPP-2002',
    stage: 'APRESENTACAO_ORCAMENTO',
    needsAttention: true,
    reasons: [A1(2), A2(9)],
    allowedTransitions: ['FOLLOW_UP', 'PERDIDA'],
  },
  {
    code: 'OPP-2003',
    stage: 'FOLLOW_UP',
    needsAttention: true,
    reasons: [A3(3), A4],
    allowedTransitions: ['APRESENTACAO_ORCAMENTO', 'FORECAST', 'PERDIDA'],
  },
  {
    code: 'OPP-2004',
    stage: 'FOLLOW_UP',
    needsAttention: true,
    reasons: [A1(5), A2(13)],
    allowedTransitions: ['APRESENTACAO_ORCAMENTO', 'FORECAST', 'PERDIDA'],
  },
  {
    code: 'OPP-2005',
    stage: 'FORECAST',
    needsAttention: false,
    reasons: [],
    allowedTransitions: ['APRESENTACAO_ORCAMENTO', 'FOLLOW_UP', 'FECHAMENTO', 'PERDIDA'],
  },
  {
    code: 'OPP-2006',
    stage: 'FECHAMENTO',
    needsAttention: false,
    reasons: [],
    allowedTransitions: [],
  },
  {
    code: 'OPP-2007',
    stage: 'PERDIDA',
    needsAttention: false,
    reasons: [],
    allowedTransitions: [],
  },
];

const CASE_DATA = [
  {
    code: 'OPP-2001',
    company: 'Tech Alpha Ltda',
    seller: 'Ana',
    product: 'Caneca personalizada',
    quantity: 300,
    estimatedValue: 4500,
    lastContactDate: '2026-10-14',
    proposalValidUntil: null,
    eventDate: '2026-11-30',
    daysWithoutContact: 1,
    isFinal: false,
    lossReason: null,
  },
  {
    code: 'OPP-2002',
    company: 'Construtora Horizonte',
    seller: 'Bruno',
    product: 'Kit escritório',
    quantity: 120,
    estimatedValue: 9800,
    lastContactDate: '2026-10-06',
    proposalValidUntil: '2026-10-13',
    eventDate: '2026-10-25',
    daysWithoutContact: 9,
    isFinal: false,
    lossReason: null,
  },
  {
    code: 'OPP-2003',
    company: 'Clínica Vida',
    seller: 'Ana',
    product: 'Squeeze personalizado',
    quantity: 500,
    estimatedValue: 7200,
    lastContactDate: '2026-10-13',
    proposalValidUntil: '2026-10-20',
    eventDate: '2026-10-18',
    daysWithoutContact: 2,
    isFinal: false,
    lossReason: null,
  },
  {
    code: 'OPP-2004',
    company: 'Agência Pulso',
    seller: 'Carla',
    product: 'Camiseta estampada',
    quantity: 80,
    estimatedValue: 3900,
    lastContactDate: '2026-10-02',
    proposalValidUntil: '2026-10-10',
    eventDate: '2026-11-05',
    daysWithoutContact: 13,
    isFinal: false,
    lossReason: null,
  },
  {
    code: 'OPP-2005',
    company: 'Banco Norte',
    seller: 'Bruno',
    product: 'Agenda executiva',
    quantity: 1000,
    estimatedValue: 38000,
    lastContactDate: '2026-10-15',
    proposalValidUntil: '2026-10-22',
    eventDate: '2026-12-12',
    daysWithoutContact: 0,
    isFinal: false,
    lossReason: null,
  },
  {
    code: 'OPP-2006',
    company: 'Escola Saber',
    seller: 'Carla',
    product: 'Mochila infantil',
    quantity: 250,
    estimatedValue: 11500,
    lastContactDate: '2026-10-09',
    proposalValidUntil: '2026-10-16',
    eventDate: '2026-10-17',
    daysWithoutContact: 6,
    isFinal: true,
    lossReason: null,
  },
  {
    code: 'OPP-2007',
    company: 'Padaria do Bairro',
    seller: 'Ana',
    product: 'Caneta promocional',
    quantity: 50,
    estimatedValue: 350,
    lastContactDate: '2026-10-01',
    proposalValidUntil: '2026-10-08',
    eventDate: '2026-10-20',
    daysWithoutContact: 14,
    isFinal: true,
    lossReason: 'NAO_REGISTRADO',
  },
];

describe('Seed — resultado esperado com hoje = 2026-10-15 (e2e)', () => {
  let t: TestApp;
  let list: Record<string, unknown>[];

  beforeAll(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    list = (await t.http().get(`${API}/opportunities`).expect(200)).body.data;
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('carrega exatamente as 7 oportunidades do case, na ordem da API (etapa → atenção → evento → código)', () => {
    expect(list.map((o) => o.code)).toEqual(EXPECTED.map((e) => e.code));
  });

  it.each(EXPECTED)(
    '$code: etapa, atenção, motivos em ordem e transições permitidas',
    (expected) => {
      const opp = list.find((o) => o.code === expected.code);
      expect(opp).toMatchObject({
        code: expected.code,
        stage: expected.stage,
        allowedTransitions: expected.allowedTransitions,
      });
      expect(opp?.attention).toEqual({
        needsAttention: expected.needsAttention,
        reasons: expected.reasons,
      });
    },
  );

  it.each(CASE_DATA)('$code: dados do case, com campos em branco como null', (c) => {
    const opp = list.find((o) => o.code === c.code);
    expect(opp).toMatchObject({
      company: c.company,
      seller: { name: c.seller },
      estimatedValue: c.estimatedValue,
      items: [{ product: c.product, quantity: c.quantity }],
      lastContactDate: c.lastContactDate,
      proposalValidUntil: c.proposalValidUntil,
      eventDate: c.eventDate,
      daysWithoutContact: c.daysWithoutContact,
      isFinal: c.isFinal,
      lossReason: c.lossReason,
      lossReasonText: null,
    });
  });

  it('o seed não fabrica histórico de etapas', async () => {
    const id = list.find((o) => o.code === 'OPP-2005')?.id as string;
    const res = await t.http().get(`${API}/opportunities/${id}`).expect(200);
    expect(res.body).toMatchObject({ code: 'OPP-2005', history: [] });
  });

  it('GET /sellers devolve Ana, Bruno e Carla em ordem alfabética', async () => {
    const res = await t.http().get(`${API}/sellers`).expect(200);
    expect(res.body.data.map((s: { name: string }) => s.name)).toEqual(['Ana', 'Bruno', 'Carla']);
  });

  it('GET /meta expõe data de referência, parâmetros, etapas e motivos aceitos (sem NAO_REGISTRADO)', async () => {
    const res = await t.http().get(`${API}/meta`).expect(200);
    expect(res.body).toMatchObject({
      referenceDate: '2026-10-15',
      parameters: { noContactDays: 5, eventWindowDays: 7 },
    });
    expect(res.body.stages).toEqual([
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
    ]);
    expect(res.body.lossReasons).toEqual([
      { code: 'PRECO', label: 'Preço', requiresText: false },
      { code: 'PRAZO', label: 'Prazo', requiresText: false },
      { code: 'CONCORRENCIA', label: 'Concorrência', requiresText: false },
      { code: 'CLIENTE_DESISTIU', label: 'Cliente desistiu', requiresText: false },
      { code: 'SEM_RESPOSTA', label: 'Sem resposta', requiresText: false },
      { code: 'OUTRO', label: 'Outro', requiresText: true },
    ]);
  });
});
