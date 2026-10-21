import {
  API,
  createTestApp,
  expectApiError,
  opportunityIds,
  resetDatabase,
  type TestApp,
} from './support/test-app.js';

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
const A4 = {
  rule: 'A4',
  code: 'VALIDADE_APOS_EVENTO',
  message: 'Validade após o evento',
  days: null,
};

describe('Escritas comerciais na oportunidade (e2e)', () => {
  let t: TestApp;
  let ids: Record<string, string>;
  const contact = (code: string) => t.http().post(`${API}/opportunities/${ids[code]}/contacts`);
  const patch = (code: string, body: Record<string, unknown>) =>
    t.http().patch(`${API}/opportunities/${ids[code]}`).send(body);

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    ids = await opportunityIds(t);
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('H2.3 — POST /opportunities/:id/contacts', () => {
    it('na OPP-2002, o último contato vira a data de referência: A2 some e A1 continua', async () => {
      const res = await contact('OPP-2002').expect(200);

      expect(res.body).toMatchObject({ lastContactDate: '2026-10-15', daysWithoutContact: 0 });
      expect(res.body.attention).toEqual({ needsAttention: true, reasons: [A1(2)] });
    });

    it('registrar de novo no mesmo dia não muda nada (idempotente) e não cria histórico de etapa', async () => {
      const first = await contact('OPP-2002').expect(200);
      const second = await contact('OPP-2002').expect(200);

      expect(second.body).toEqual(first.body);
      expect(second.body.history).toEqual([]);
    });

    it.each(['OPP-2006', 'OPP-2007'])('%s em estado final é recusada', async (code) => {
      const res = await contact(code);
      expectApiError(res, 422, 'ESTADO_FINAL');
    });
  });

  describe('H2.4 — PATCH /opportunities/:id', () => {
    it('muda só os campos enviados', async () => {
      const res = await patch('OPP-2005', { estimatedValue: 40000 }).expect(200);

      expect(res.body).toMatchObject({
        estimatedValue: 40000,
        proposalValidUntil: '2026-10-22',
        eventDate: '2026-12-12',
        items: [{ product: 'Agenda executiva', quantity: 1000 }],
        stage: 'FORECAST',
      });
    });

    it('items substitui a lista inteira (vários itens por oportunidade, ADR-004)', async () => {
      const items = [
        { product: 'Agenda executiva', quantity: 800 },
        { product: 'Caneta metálica', quantity: 800 },
      ];

      const res = await patch('OPP-2005', { items }).expect(200);

      expect(res.body.items).toEqual(items.map((i) => ({ id: expect.any(String), ...i })));
    });

    it('validade após o evento não bloqueia: vira alerta A4', async () => {
      const res = await patch('OPP-2005', { proposalValidUntil: '2026-12-20' }).expect(200);

      expect(res.body.proposalValidUntil).toBe('2026-12-20');
      expect(res.body.attention).toEqual({ needsAttention: true, reasons: [A4] });
    });

    it('renovar a validade da OPP-2002 tira o A1 e mantém o A2', async () => {
      const res = await patch('OPP-2002', { proposalValidUntil: '2026-10-20' }).expect(200);
      expect(res.body.attention).toEqual({ needsAttention: true, reasons: [A2(9)] });
    });

    it('limpar a data do evento da OPP-2003 tira A3 e A4 (sem evento, as regras não se aplicam)', async () => {
      const res = await patch('OPP-2003', { eventDate: null }).expect(200);

      expect(res.body.eventDate).toBeNull();
      expect(res.body.attention).toEqual({ needsAttention: false, reasons: [] });
    });

    it('em Primeiro Contato (OPP-2001), limpar valor estimado e itens é permitido', async () => {
      const res = await patch('OPP-2001', { estimatedValue: null, items: [] }).expect(200);
      expect(res.body).toMatchObject({ estimatedValue: null, items: [] });
    });

    it.each([
      ['sem valor estimado', { estimatedValue: null }, ['estimatedValue']],
      ['sem itens', { items: [] }, ['items']],
      ['sem valor e sem itens', { estimatedValue: null, items: [] }, ['estimatedValue', 'items']],
    ])(
      'a partir de Apresentação de Orçamento (OPP-2002), deixar %s é recusado',
      async (_desc, body, missing) => {
        const res = await patch('OPP-2002', body);

        expectApiError(res, 422, 'REQUISITOS_ORCAMENTO');
        expect(res.body.message).toBe(
          'A partir de Apresentação de Orçamento a oportunidade precisa de valor estimado e pelo menos 1 item.',
        );
        expect(res.body.details).toEqual({ missing });
      },
    );

    it('a recusa do PATCH não altera nada', async () => {
      await patch('OPP-2002', { estimatedValue: null, proposalValidUntil: '2026-10-30' }).expect(
        422,
      );

      const res = await t.http().get(`${API}/opportunities/${ids['OPP-2002']}`).expect(200);
      expect(res.body).toMatchObject({ estimatedValue: 9800, proposalValidUntil: '2026-10-13' });
    });

    it.each(['OPP-2006', 'OPP-2007'])('%s em estado final é recusada', async (code) => {
      const res = await patch(code, { estimatedValue: 100 });
      expectApiError(res, 422, 'ESTADO_FINAL');
    });
  });
});
