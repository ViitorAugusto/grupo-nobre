import {
  API,
  createTestApp,
  expectApiError,
  MISSING_ID,
  opportunityIds,
  resetDatabase,
  type TestApp,
} from './support/test-app.js';

describe('Formato único de erro (e2e)', () => {
  let t: TestApp;
  let ids: Record<string, string>;
  const move = (code: string, body: unknown) =>
    t
      .http()
      .post(`${API}/opportunities/${ids[code]}/stage-changes`)
      .send(body as object);
  const patch = (code: string, body: unknown) =>
    t
      .http()
      .patch(`${API}/opportunities/${ids[code]}`)
      .send(body as object);

  beforeAll(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    ids = await opportunityIds(t);
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('400 VALIDACAO_INVALIDA — stage-changes', () => {
    it.each([
      ['sem toStage', {}, 'toStage'],
      ['toStage inexistente', { toStage: 'NEGOCIACAO' }, 'toStage'],
      ['lossReason inexistente', { toStage: 'PERDIDA', lossReason: 'CARO' }, 'lossReason'],
      [
        'lossReason NAO_REGISTRADO (só legado)',
        { toStage: 'PERDIDA', lossReason: 'NAO_REGISTRADO' },
        'lossReason',
      ],
      [
        'lossReasonText com mais de 500 caracteres',
        { toStage: 'PERDIDA', lossReason: 'OUTRO', lossReasonText: 'x'.repeat(501) },
        'lossReasonText',
      ],
      ['campo desconhecido', { toStage: 'FORECAST', vendedor: 'Carla' }, 'vendedor'],
    ])('%s', async (_desc, body, field) => {
      const res = await move('OPP-2004', body);

      expectApiError(res, 400, 'VALIDACAO_INVALIDA');
      expect(res.body.details).toEqual(
        expect.arrayContaining([{ field, message: expect.any(String) }]),
      );
    });

    it.each([
      ['lossReason com destino diferente de Perdida', { toStage: 'FORECAST', lossReason: 'PRECO' }],
      [
        'lossReasonText com destino diferente de Perdida',
        { toStage: 'FORECAST', lossReasonText: 'texto' },
      ],
    ])('%s', async (_desc, body) => {
      const res = await move('OPP-2004', body);
      expectApiError(res, 400, 'VALIDACAO_INVALIDA');
    });
  });

  describe('400 VALIDACAO_INVALIDA — PATCH', () => {
    it.each([
      ['estimatedValue zero', { estimatedValue: 0 }, 'estimatedValue'],
      ['estimatedValue negativo', { estimatedValue: -10 }, 'estimatedValue'],
      ['estimatedValue com 3 casas', { estimatedValue: 10.123 }, 'estimatedValue'],
      ['estimatedValue texto', { estimatedValue: '9800' }, 'estimatedValue'],
      ['data fora de AAAA-MM-DD', { proposalValidUntil: '30/10/2026' }, 'proposalValidUntil'],
      ['data inexistente', { eventDate: '2026-02-30' }, 'eventDate'],
      [
        'item com quantidade zero',
        { items: [{ product: 'Kit', quantity: 0 }] },
        'items.0.quantity',
      ],
      [
        'item com quantidade fracionada',
        { items: [{ product: 'Kit', quantity: 1.5 }] },
        'items.0.quantity',
      ],
      ['item sem produto', { items: [{ product: '', quantity: 10 }] }, 'items.0.product'],
      [
        'produto com mais de 120 caracteres',
        { items: [{ product: 'x'.repeat(121), quantity: 10 }] },
        'items.0.product',
      ],
      [
        'mais de 50 itens',
        { items: Array.from({ length: 51 }, (_, i) => ({ product: `Item ${i}`, quantity: 1 })) },
        'items',
      ],
      ['campo desconhecido', { stage: 'FECHAMENTO' }, 'stage'],
    ])('%s', async (_desc, body, field) => {
      const res = await patch('OPP-2005', body);

      expectApiError(res, 400, 'VALIDACAO_INVALIDA');
      expect(res.body.details).toEqual(
        expect.arrayContaining([{ field, message: expect.any(String) }]),
      );
    });
  });

  describe('404 NAO_ENCONTRADO', () => {
    it.each([
      ['GET detalhe', () => t.http().get(`${API}/opportunities/${MISSING_ID}`)],
      [
        'POST stage-changes',
        () =>
          t
            .http()
            .post(`${API}/opportunities/${MISSING_ID}/stage-changes`)
            .send({ toStage: 'FORECAST' }),
      ],
      ['POST contacts', () => t.http().post(`${API}/opportunities/${MISSING_ID}/contacts`)],
      [
        'PATCH',
        () => t.http().patch(`${API}/opportunities/${MISSING_ID}`).send({ estimatedValue: 100 }),
      ],
      ['rota inexistente', () => t.http().get(`${API}/negociacoes`)],
    ])('%s de oportunidade/rota inexistente', async (_desc, call) => {
      const res = await call();
      expectApiError(res, 404, 'NAO_ENCONTRADO');
    });
  });

  describe('422 — cada código de regra de negócio', () => {
    it.each([
      ['ESTADO_FINAL', () => move('OPP-2006', { toStage: 'FORECAST' }), { stage: 'FECHAMENTO' }],
      [
        'TRANSICAO_INVALIDA',
        () => move('OPP-2004', { toStage: 'FECHAMENTO' }),
        { from: 'FOLLOW_UP', to: 'FECHAMENTO' },
      ],
      [
        'REQUISITOS_ORCAMENTO (PATCH)',
        () => patch('OPP-2002', { items: [] }),
        { missing: ['items'] },
      ],
      ['MOTIVO_PERDA_OBRIGATORIO', () => move('OPP-2004', { toStage: 'PERDIDA' }), undefined],
      [
        'MOTIVO_PERDA_TEXTO_OBRIGATORIO',
        () => move('OPP-2004', { toStage: 'PERDIDA', lossReason: 'OUTRO' }),
        undefined,
      ],
    ])('%s', async (label, call, details) => {
      const res = await call();

      expectApiError(res, 422, label.split(' ')[0]);
      expect(res.body.details).toEqual(details);
    });
  });
});
