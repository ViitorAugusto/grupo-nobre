import {
  API,
  createTestApp,
  expectApiError,
  MISSING_ID,
  resetDatabase,
  type TestApp,
} from './support/test-app.js';

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
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

describe('Fila de retorno do dia (e2e)', () => {
  let t: TestApp;
  let sellers: Record<string, string>;
  let opps: Record<string, string>;

  const run = (body: Record<string, unknown> = {}) =>
    t.http().post(`${API}/follow-up-queue/runs`).send(body);
  const queue = (seller: string, query: Record<string, string> = {}) =>
    t
      .http()
      .get(`${API}/follow-up-queue`)
      .query({ sellerId: sellers[seller], ...query });
  const queueCodes = async (seller: string, query: Record<string, string> = {}) =>
    (
      (await queue(seller, query).expect(200)).body.items as { opportunity: { code: string } }[]
    ).map((item) => item.opportunity.code);
  const summaries = (query: Record<string, string> = {}) =>
    t.http().get(`${API}/follow-up-queue/summaries`).query(query);

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    const sellerRows = await t.prisma.seller.findMany();
    sellers = Object.fromEntries(sellerRows.map((s) => [s.name, s.id]));
    const oppRows = await t.prisma.opportunity.findMany();
    opps = Object.fromEntries(oppRows.map((o) => [o.code, o.id]));
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('H5.1 — gerar a fila do dia', () => {
    it('POST /runs devolve a data, o instante da geração e a contagem por vendedor (ordem alfabética)', async () => {
      const res = await run().expect(200);

      expect(res.body).toEqual({
        date: '2026-10-15',
        generatedAt: expect.stringMatching(ISO_INSTANT),
        sellers: [
          { seller: { id: sellers.Ana, name: 'Ana' }, itemCount: 1 },
          { seller: { id: sellers.Bruno, name: 'Bruno' }, itemCount: 1 },
          { seller: { id: sellers.Carla, name: 'Carla' }, itemCount: 1 },
        ],
      });
    });

    it.each([
      ['Ana', 'OPP-2003', 'Clínica Vida', 7200, [A3(3), A4]],
      ['Bruno', 'OPP-2002', 'Construtora Horizonte', 9800, [A1(2), A2(9)]],
      ['Carla', 'OPP-2004', 'Agência Pulso', 3900, [A1(5), A2(13)]],
    ])(
      'T12 — seed: %s → %s, com todos os motivos',
      async (seller, code, company, estimatedValue, reasons) => {
        await run().expect(200);

        const res = await queue(seller).expect(200);

        expect(res.body).toEqual({
          date: '2026-10-15',
          seller: { id: sellers[seller], name: seller },
          generatedAt: expect.stringMatching(ISO_INSTANT),
          items: [
            {
              position: 1,
              opportunity: { id: opps[code], code, company, estimatedValue },
              reasons,
            },
          ],
        });
      },
    );

    it('T5 — rodar duas vezes na mesma data dá o mesmo resultado, sem duplicar', async () => {
      await run({ date: '2026-10-15' }).expect(200);
      const first = (await queue('Bruno').expect(200)).body;
      await run({ date: '2026-10-15' }).expect(200);
      const second = (await queue('Bruno').expect(200)).body;

      expect(second.items).toEqual(first.items);
      expect(await t.prisma.followUpRun.count()).toBe(1);
      expect(await t.prisma.followUpRunItem.count()).toBe(3);
      expect(await t.prisma.followUpSummary.count()).toBe(3);
    });

    it('rodar de novo substitui pelo estado atual (não acumula itens antigos)', async () => {
      await run().expect(200);
      await t
        .http()
        .patch(`${API}/opportunities/${opps['OPP-2003']}`)
        .send({ eventDate: null })
        .expect(200);

      const res = await run().expect(200);

      expect(res.body.sellers[0]).toEqual({
        seller: { id: sellers.Ana, name: 'Ana' },
        itemCount: 0,
      });
      expect(await t.prisma.followUpRunItem.count()).toBe(2);
    });

    it('rotina ainda não rodou para a data: 200 com generatedAt null e items [] (não é erro)', async () => {
      const res = await queue('Bruno').expect(200);
      expect(res.body).toEqual({
        date: '2026-10-15',
        seller: { id: sellers.Bruno, name: 'Bruno' },
        generatedAt: null,
        items: [],
      });
    });

    it('a fila de uma data não vale para outra data', async () => {
      await run().expect(200);
      const res = await queue('Bruno', { date: '2026-10-16' }).expect(200);
      expect(res.body).toMatchObject({ date: '2026-10-16', generatedAt: null, items: [] });
    });

    it('fila de vários itens segue a prioridade e posições 1, 2…', async () => {
      await t
        .http()
        .patch(`${API}/opportunities/${opps['OPP-2005']}`)
        .send({ eventDate: '2026-10-20' })
        .expect(200);
      await run({ date: '2026-10-16' }).expect(200);

      const res = await queue('Bruno', { date: '2026-10-16' }).expect(200);

      expect(
        res.body.items.map((i: { position: number; opportunity: { code: string } }) => [
          i.position,
          i.opportunity.code,
        ]),
      ).toEqual([
        [1, 'OPP-2005'],
        [2, 'OPP-2002'],
      ]);
    });
  });

  describe('H5.3 — dar baixa no retorno', () => {
    it('T6 — contato na OPP-2002 tira da fila do Bruno; no Kanban o A2 some e o A1 continua', async () => {
      await run().expect(200);

      const contact = await t
        .http()
        .post(`${API}/opportunities/${opps['OPP-2002']}/contacts`)
        .expect(200);

      expect(contact.body.attention).toEqual({ needsAttention: true, reasons: [A1(2)] });
      expect(await queueCodes('Bruno')).toEqual([]);
    });

    it('T6 — no dia seguinte, a OPP-2002 volta para a fila se ainda tiver a proposta vencida', async () => {
      await t.http().post(`${API}/opportunities/${opps['OPP-2002']}/contacts`).expect(200);
      await run({ date: '2026-10-16' }).expect(200);

      const res = await queue('Bruno', { date: '2026-10-16' }).expect(200);

      expect(res.body.items).toEqual([
        expect.objectContaining({
          position: 1,
          opportunity: expect.objectContaining({ code: 'OPP-2002' }),
          reasons: [
            {
              rule: 'A1',
              code: 'PROPOSTA_VENCIDA',
              message: 'Proposta vencida há 3 dias',
              days: 3,
            },
          ],
        }),
      ]);
    });

    it('contato registrado ANTES da rotina: a oportunidade nem entra na fila do dia', async () => {
      await t.http().post(`${API}/opportunities/${opps['OPP-2002']}/contacts`).expect(200);

      const res = await run().expect(200);

      expect(res.body.sellers[1]).toMatchObject({ seller: { name: 'Bruno' }, itemCount: 0 });
    });

    it.each([
      ['Fechamento', 'OPP-2004', [{ toStage: 'FORECAST' }, { toStage: 'FECHAMENTO' }]],
      ['Perdida', 'OPP-2004', [{ toStage: 'PERDIDA', lossReason: 'PRAZO' }]],
    ])('movida para %s, sai da fila', async (_label, code, moves) => {
      await run().expect(200);
      for (const body of moves) {
        await t
          .http()
          .post(`${API}/opportunities/${opps[code]}/stage-changes`)
          .send(body)
          .expect(200);
      }
      expect(await queueCodes('Carla')).toEqual([]);
    });

    it('causa resolvida (sem evento: A3 e A4 somem) sai da fila', async () => {
      await run().expect(200);
      await t
        .http()
        .patch(`${API}/opportunities/${opps['OPP-2003']}`)
        .send({ eventDate: null })
        .expect(200);

      expect(await queueCodes('Ana')).toEqual([]);
    });

    it('item que continua na fila mostra os motivos atuais', async () => {
      await run().expect(200);
      await t
        .http()
        .patch(`${API}/opportunities/${opps['OPP-2004']}`)
        .send({ proposalValidUntil: '2026-10-30' })
        .expect(200);

      const res = await queue('Carla').expect(200);
      expect(res.body.items).toEqual([expect.objectContaining({ position: 1, reasons: [A2(13)] })]);
    });

    it('posições são recalculadas sem buracos quando o 1º item sai', async () => {
      await t
        .http()
        .patch(`${API}/opportunities/${opps['OPP-2005']}`)
        .send({ eventDate: '2026-10-20' })
        .expect(200);
      await run({ date: '2026-10-16' }).expect(200);
      await t
        .http()
        .post(`${API}/opportunities/${opps['OPP-2005']}/stage-changes`)
        .send({ toStage: 'PERDIDA', lossReason: 'PRECO' })
        .expect(200);

      const res = await queue('Bruno', { date: '2026-10-16' }).expect(200);
      expect(
        res.body.items.map((i: { position: number; opportunity: { code: string } }) => [
          i.position,
          i.opportunity.code,
        ]),
      ).toEqual([[1, 'OPP-2002']]);
    });
  });

  describe('H5.4 — resumo do dia (envio simulado)', () => {
    it('gera um resumo por vendedor com pendência, com o texto do exemplo para o Bruno', async () => {
      await run().expect(200);

      const res = await summaries().expect(200);

      expect(res.body.data.map((s: { seller: { name: string } }) => s.seller.name)).toEqual([
        'Ana',
        'Bruno',
        'Carla',
      ]);
      expect(res.body.data[1]).toEqual({
        date: '2026-10-15',
        seller: { id: sellers.Bruno, name: 'Bruno' },
        text:
          'Bom dia, Bruno! Você tem 1 retorno hoje (15/10/2026):\n' +
          '1. OPP-2002 · Construtora Horizonte · R$ 9.800 — Proposta vencida há 2 dias; 9 dias sem contato',
        createdAt: expect.stringMatching(ISO_INSTANT),
      });
    });

    it('filtra por vendedor', async () => {
      await run().expect(200);
      const res = await summaries({ sellerId: sellers.Carla }).expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].text).toContain('OPP-2004 · Agência Pulso · R$ 3.900');
    });

    it('T11 — vendedor sem pendências: fila vazia e nenhum resumo', async () => {
      await t
        .http()
        .patch(`${API}/opportunities/${opps['OPP-2003']}`)
        .send({ eventDate: null })
        .expect(200);
      await run().expect(200);

      const fila = await queue('Ana').expect(200);
      const resumo = await summaries({ sellerId: sellers.Ana }).expect(200);

      expect(fila.body).toMatchObject({
        generatedAt: expect.stringMatching(ISO_INSTANT),
        items: [],
      });
      expect(resumo.body).toEqual({ data: [] });
    });

    it('sem rotina na data, não há resumos', async () => {
      const res = await summaries().expect(200);
      expect(res.body).toEqual({ data: [] });
    });
  });

  describe('erros', () => {
    it('vendedor inexistente → 404 NAO_ENCONTRADO', async () => {
      const res = await t.http().get(`${API}/follow-up-queue`).query({ sellerId: MISSING_ID });
      expectApiError(res, 404, 'NAO_ENCONTRADO');
    });

    it.each([
      ['GET sem sellerId', () => t.http().get(`${API}/follow-up-queue`)],
      [
        'GET com sellerId malformado',
        () => t.http().get(`${API}/follow-up-queue`).query({ sellerId: 'bruno' }),
      ],
      ['GET com data inválida', () => queue('Bruno', { date: '15/10/2026' })],
      ['POST /runs com data inexistente', () => run({ date: '2026-02-30' })],
      ['POST /runs com campo desconhecido', () => run({ sellerId: MISSING_ID })],
      ['GET /summaries com data inválida', () => summaries({ date: 'hoje' })],
    ])('%s → 400 VALIDACAO_INVALIDA', async (_desc, call) => {
      const res = await call();
      expectApiError(res, 400, 'VALIDACAO_INVALIDA');
    });
  });
});
