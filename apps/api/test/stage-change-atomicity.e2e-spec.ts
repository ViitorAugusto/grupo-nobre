import {
  API,
  createTestApp,
  expectApiError,
  installHistoryFailure,
  opportunityIds,
  removeHistoryFailure,
  resetDatabase,
  SIMULATED_HISTORY_FAILURE as SIMULATED_FAILURE,
  type TestApp,
} from './support/test-app.js';

describe('Atomicidade da mudança de etapa (e2e)', () => {
  let t: TestApp;
  let ids: Record<string, string>;

  beforeAll(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    ids = await opportunityIds(t);
    await installHistoryFailure(t.prisma);
  });

  afterAll(async () => {
    await removeHistoryFailure(t.prisma);
    await t.app.close();
  });

  it('responde 500 ERRO_INTERNO no formato único, sem detalhe interno', async () => {
    const res = await t
      .http()
      .post(`${API}/opportunities/${ids['OPP-2004']}/stage-changes`)
      .send({ toStage: 'FORECAST' });

    expectApiError(res, 500, 'ERRO_INTERNO');
    expect(res.text).not.toContain(SIMULATED_FAILURE);
    expect(res.text).not.toContain('stage_history');
  });

  it('a etapa continua a original e o histórico continua vazio', async () => {
    await t
      .http()
      .post(`${API}/opportunities/${ids['OPP-2004']}/stage-changes`)
      .send({ toStage: 'FORECAST' });

    const res = await t.http().get(`${API}/opportunities/${ids['OPP-2004']}`).expect(200);
    expect(res.body).toMatchObject({ stage: 'FOLLOW_UP', history: [] });
  });

  it('também vale para Perdida: etapa e motivo não mudam', async () => {
    await t
      .http()
      .post(`${API}/opportunities/${ids['OPP-2002']}/stage-changes`)
      .send({ toStage: 'PERDIDA', lossReason: 'PRECO' });

    const res = await t.http().get(`${API}/opportunities/${ids['OPP-2002']}`).expect(200);
    expect(res.body).toMatchObject({
      stage: 'APRESENTACAO_ORCAMENTO',
      lossReason: null,
      history: [],
    });
  });
});
