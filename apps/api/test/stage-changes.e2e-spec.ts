import {
  API,
  createTestApp,
  expectApiError,
  MISSING_ID,
  opportunityIds,
  resetDatabase,
  type TestApp,
} from './support/test-app.js';

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

describe('POST /opportunities/:id/stage-changes (e2e)', () => {
  let t: TestApp;
  let ids: Record<string, string>;
  const move = (code: string, body: Record<string, unknown>) =>
    t.http().post(`${API}/opportunities/${ids[code]}/stage-changes`).send(body);
  const detail = (code: string) => t.http().get(`${API}/opportunities/${ids[code]}`).expect(200);
  const patch = (code: string, body: Record<string, unknown>) =>
    t.http().patch(`${API}/opportunities/${ids[code]}`).send(body).expect(200);

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

  describe('H1.1 — mover de etapa', () => {
    it('Follow-up → Forecast muda a etapa e registra no histórico de onde, para onde e quando', async () => {
      const res = await move('OPP-2004', { toStage: 'FORECAST' }).expect(200);

      expect(res.body).toMatchObject({
        code: 'OPP-2004',
        stage: 'FORECAST',
        allowedTransitions: ['APRESENTACAO_ORCAMENTO', 'FOLLOW_UP', 'FECHAMENTO', 'PERDIDA'],
      });
      expect(res.body.history).toEqual([
        {
          id: expect.any(String),
          fromStage: 'FOLLOW_UP',
          toStage: 'FORECAST',
          lossReason: null,
          lossReasonText: null,
          changedAt: expect.stringMatching(ISO_INSTANT),
        },
      ]);
    });

    it('a mudança fica gravada (o detalhe consultado depois mostra a nova etapa e o histórico)', async () => {
      await move('OPP-2004', { toStage: 'FORECAST' }).expect(200);

      const res = await detail('OPP-2004');
      expect(res.body.stage).toBe('FORECAST');
      expect(res.body.history).toHaveLength(1);
    });

    it('Primeiro Contato → Apresentação de Orçamento com valor e item é aceito', async () => {
      const res = await move('OPP-2001', { toStage: 'APRESENTACAO_ORCAMENTO' }).expect(200);
      expect(res.body.stage).toBe('APRESENTACAO_ORCAMENTO');
    });

    it('Primeiro Contato sem item → Apresentação de Orçamento é recusado e informa o que falta', async () => {
      await patch('OPP-2001', { items: [] });

      const res = await move('OPP-2001', { toStage: 'APRESENTACAO_ORCAMENTO' });

      expectApiError(res, 422, 'REQUISITOS_ORCAMENTO');
      expect(res.body.message).toBe(
        'Para ir para Apresentação de Orçamento, informe pelo menos 1 item.',
      );
      expect(res.body.details).toEqual({ missing: ['items'] });
    });

    it('Primeiro Contato sem valor estimado → Apresentação de Orçamento é recusado e informa o que falta', async () => {
      await patch('OPP-2001', { estimatedValue: null });

      const res = await move('OPP-2001', { toStage: 'APRESENTACAO_ORCAMENTO' });

      expectApiError(res, 422, 'REQUISITOS_ORCAMENTO');
      expect(res.body.message).toBe(
        'Para ir para Apresentação de Orçamento, informe o valor estimado.',
      );
      expect(res.body.details).toEqual({ missing: ['estimatedValue'] });
    });

    it('Primeiro Contato sem valor e sem item → recusa listando os dois', async () => {
      await patch('OPP-2001', { estimatedValue: null, items: [] });

      const res = await move('OPP-2001', { toStage: 'APRESENTACAO_ORCAMENTO' });

      expectApiError(res, 422, 'REQUISITOS_ORCAMENTO');
      expect(res.body.message).toBe(
        'Para ir para Apresentação de Orçamento, informe o valor estimado e pelo menos 1 item.',
      );
      expect(res.body.details).toEqual({ missing: ['estimatedValue', 'items'] });
    });

    it('Follow-up → Fechamento é recusado: Fechamento só a partir de Forecast', async () => {
      const res = await move('OPP-2004', { toStage: 'FECHAMENTO' });

      expectApiError(res, 422, 'TRANSICAO_INVALIDA');
      expect(res.body.message).toBe('Fechamento só pode ser aplicado a partir de Forecast.');
      expect(res.body.details).toEqual({ from: 'FOLLOW_UP', to: 'FECHAMENTO' });
    });

    it('pulo para frente é recusado dizendo qual é o próximo passo', async () => {
      const res = await move('OPP-2001', { toStage: 'FOLLOW_UP' });

      expectApiError(res, 422, 'TRANSICAO_INVALIDA');
      expect(res.body.message).toBe(
        'Avance uma etapa por vez: de Primeiro Contato o próximo passo é Apresentação de Orçamento.',
      );
      expect(res.body.details).toEqual({ from: 'PRIMEIRO_CONTATO', to: 'FOLLOW_UP' });
    });

    it('retorno fora da matriz é recusado (Apresentação de Orçamento → Primeiro Contato)', async () => {
      const res = await move('OPP-2002', { toStage: 'PRIMEIRO_CONTATO' });

      expectApiError(res, 422, 'TRANSICAO_INVALIDA');
      expect(res.body.message).toBe(
        'Não é possível voltar de Apresentação de Orçamento para Primeiro Contato.',
      );
    });

    it('retorno permitido: Forecast → Follow-up (esfriou)', async () => {
      const res = await move('OPP-2005', { toStage: 'FOLLOW_UP' }).expect(200);
      expect(res.body.stage).toBe('FOLLOW_UP');
    });

    it.each([
      ['OPP-2006', 'FECHAMENTO', 'Fechamento', 'FORECAST'],
      ['OPP-2007', 'PERDIDA', 'Perdida', 'FOLLOW_UP'],
    ])('%s em %s (estado final) não pode ser movida', async (code, stage, label, toStage) => {
      const res = await move(code, { toStage });

      expectApiError(res, 422, 'ESTADO_FINAL');
      expect(res.body.message).toBe(
        `Oportunidade em ${label} é um estado final e não pode ser alterada.`,
      );
      expect(res.body.details).toEqual({ stage });
    });

    it('a recusa não muda a etapa nem grava histórico', async () => {
      await move('OPP-2004', { toStage: 'FECHAMENTO' }).expect(422);

      const res = await detail('OPP-2004');
      expect(res.body.stage).toBe('FOLLOW_UP');
      expect(res.body.history).toEqual([]);
    });
  });

  describe('H1.2 — marcar como perdida', () => {
    it('com motivo da lista é aceito e o motivo fica na oportunidade e no histórico', async () => {
      const res = await move('OPP-2002', { toStage: 'PERDIDA', lossReason: 'PRECO' }).expect(200);

      expect(res.body).toMatchObject({
        stage: 'PERDIDA',
        isFinal: true,
        lossReason: 'PRECO',
        lossReasonText: null,
        attention: { needsAttention: false, reasons: [] },
        allowedTransitions: [],
      });
      expect(res.body.history).toEqual([
        expect.objectContaining({
          fromStage: 'APRESENTACAO_ORCAMENTO',
          toStage: 'PERDIDA',
          lossReason: 'PRECO',
        }),
      ]);
    });

    it('"Outro" com texto é aceito e o texto fica no histórico', async () => {
      const lossReasonText = 'Cliente fechou com fornecedor interno';
      const res = await move('OPP-2004', {
        toStage: 'PERDIDA',
        lossReason: 'OUTRO',
        lossReasonText,
      }).expect(200);

      expect(res.body).toMatchObject({ lossReason: 'OUTRO', lossReasonText });
      expect(res.body.history[0]).toMatchObject({ lossReason: 'OUTRO', lossReasonText });
    });

    it('sem motivo é recusado', async () => {
      const res = await move('OPP-2004', { toStage: 'PERDIDA' });

      expectApiError(res, 422, 'MOTIVO_PERDA_OBRIGATORIO');
      expect(res.body.message).toBe('Informe o motivo da perda.');
    });

    it('"Outro" sem texto é recusado', async () => {
      const res = await move('OPP-2004', { toStage: 'PERDIDA', lossReason: 'OUTRO' });

      expectApiError(res, 422, 'MOTIVO_PERDA_TEXTO_OBRIGATORIO');
      expect(res.body.message).toBe('Descreva o motivo da perda ao escolher "Outro".');
    });

    it('NAO_REGISTRADO não é aceito na entrada (só existe no dado legado do seed)', async () => {
      const res = await move('OPP-2004', { toStage: 'PERDIDA', lossReason: 'NAO_REGISTRADO' });
      expectApiError(res, 400, 'VALIDACAO_INVALIDA');
    });
  });

  describe('H1.3 — histórico', () => {
    it('lista as mudanças em ordem cronológica com origem, destino e motivo', async () => {
      await move('OPP-2004', { toStage: 'FORECAST' }).expect(200);
      await move('OPP-2004', { toStage: 'FOLLOW_UP' }).expect(200);
      await move('OPP-2004', { toStage: 'PERDIDA', lossReason: 'SEM_RESPOSTA' }).expect(200);

      const { history } = (await detail('OPP-2004')).body;

      expect(
        history.map((h: Record<string, unknown>) => [h.fromStage, h.toStage, h.lossReason]),
      ).toEqual([
        ['FOLLOW_UP', 'FORECAST', null],
        ['FORECAST', 'FOLLOW_UP', null],
        ['FOLLOW_UP', 'PERDIDA', 'SEM_RESPOSTA'],
      ]);
      const instants: string[] = history.map((h: { changedAt: string }) => h.changedAt);
      expect([...instants].sort((a, b) => a.localeCompare(b))).toEqual(instants);
    });
  });

  describe('ordem de validação (a primeira falha responde)', () => {
    it('1. oportunidade inexistente → 404 NAO_ENCONTRADO', async () => {
      const res = await t
        .http()
        .post(`${API}/opportunities/${MISSING_ID}/stage-changes`)
        .send({ toStage: 'FORECAST' });
      expectApiError(res, 404, 'NAO_ENCONTRADO');
    });

    it('2. estado final vem antes de "mesma etapa": Perdida → Perdida é ESTADO_FINAL', async () => {
      const res = await move('OPP-2007', { toStage: 'PERDIDA', lossReason: 'PRECO' });
      expectApiError(res, 422, 'ESTADO_FINAL');
    });

    it('2. estado final vem antes da matriz: Fechamento → Perdida é ESTADO_FINAL', async () => {
      const res = await move('OPP-2006', { toStage: 'PERDIDA', lossReason: 'PRECO' });
      expectApiError(res, 422, 'ESTADO_FINAL');
    });

    it('3. mesma etapa → 200 sem mudança e sem histórico', async () => {
      const res = await move('OPP-2004', { toStage: 'FOLLOW_UP' }).expect(200);

      expect(res.body).toMatchObject({ stage: 'FOLLOW_UP', history: [] });
    });

    it('4. matriz vem antes dos requisitos: Primeiro Contato sem item → Forecast é TRANSICAO_INVALIDA', async () => {
      await patch('OPP-2001', { estimatedValue: null, items: [] });

      const res = await move('OPP-2001', { toStage: 'FORECAST' });

      expectApiError(res, 422, 'TRANSICAO_INVALIDA');
    });

    it('6. o motivo é checado antes do texto: só texto, sem motivo, é MOTIVO_PERDA_OBRIGATORIO', async () => {
      const res = await move('OPP-2004', { toStage: 'PERDIDA', lossReasonText: 'Sem verba' });
      expectApiError(res, 422, 'MOTIVO_PERDA_OBRIGATORIO');
    });
  });
});
