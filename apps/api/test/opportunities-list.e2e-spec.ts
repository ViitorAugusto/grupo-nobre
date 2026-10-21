import {
  API,
  codesOf,
  createTestApp,
  expectApiError,
  MISSING_ID,
  resetDatabase,
  sellerIds,
  type TestApp,
} from './support/test-app.js';

describe('GET /opportunities — busca e filtros (e2e)', () => {
  let t: TestApp;
  let sellers: Record<string, string>;
  const list = (query: Record<string, string>) => t.http().get(`${API}/opportunities`).query(query);

  beforeAll(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    sellers = await sellerIds(t);
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('Carla + precisa de atenção devolve só a OPP-2004 (critério da Fase 2)', async () => {
    const res = await list({ sellerId: sellers.Carla, needsAttention: 'true' }).expect(200);
    expect(codesOf(res.body)).toEqual(['OPP-2004']);
  });

  it('busca sem resultado devolve 200 com lista vazia', async () => {
    const res = await list({ search: 'empresa que não existe' }).expect(200);
    expect(res.body).toEqual({ data: [] });
  });

  it('filtros sem nenhum resultado em comum devolvem lista vazia', async () => {
    const res = await list({ sellerId: sellers.Carla, stage: 'PRIMEIRO_CONTATO' }).expect(200);
    expect(res.body).toEqual({ data: [] });
  });

  it.each([
    ['pelo nome da empresa', 'Horizonte', ['OPP-2002']],
    ['sem diferenciar maiúsculas', 'banco norte', ['OPP-2005']],
    ['sem diferenciar acentos', 'clinica', ['OPP-2003']],
    ['com acento na busca e no dado', 'Agência', ['OPP-2004']],
    ['pelo código', 'OPP-2006', ['OPP-2006']],
    [
      'por parte do código, em minúsculas',
      'opp-200',
      ['OPP-2001', 'OPP-2002', 'OPP-2003', 'OPP-2004', 'OPP-2005', 'OPP-2006', 'OPP-2007'],
    ],
  ])('busca %s ("%s")', async (_desc, search, expected) => {
    const res = await list({ search }).expect(200);
    expect(codesOf(res.body)).toEqual(expected);
  });

  it('filtra por vendedor (Ana)', async () => {
    const res = await list({ sellerId: sellers.Ana }).expect(200);
    expect(codesOf(res.body)).toEqual(['OPP-2001', 'OPP-2003', 'OPP-2007']);
  });

  it('filtra por etapa (Follow-up), com atenção e evento mais próximo primeiro', async () => {
    const res = await list({ stage: 'FOLLOW_UP' }).expect(200);
    expect(codesOf(res.body)).toEqual(['OPP-2003', 'OPP-2004']);
  });

  it('filtra por precisa de atenção = true', async () => {
    const res = await list({ needsAttention: 'true' }).expect(200);
    expect(codesOf(res.body)).toEqual(['OPP-2002', 'OPP-2003', 'OPP-2004']);
  });

  it('filtra por precisa de atenção = false (inclui estados finais)', async () => {
    const res = await list({ needsAttention: 'false' }).expect(200);
    expect(codesOf(res.body)).toEqual(['OPP-2001', 'OPP-2005', 'OPP-2006', 'OPP-2007']);
  });

  it('combina busca, vendedor e etapa com E', async () => {
    const res = await list({ search: 'vida', sellerId: sellers.Ana, stage: 'FOLLOW_UP' }).expect(
      200,
    );
    expect(codesOf(res.body)).toEqual(['OPP-2003']);
  });

  it('vendedor com UUID válido sem oportunidades devolve lista vazia', async () => {
    const res = await list({ sellerId: MISSING_ID }).expect(200);
    expect(res.body).toEqual({ data: [] });
  });

  it.each([
    ['sellerId que não é UUID', { sellerId: 'carla' }],
    ['stage inexistente', { stage: 'NEGOCIACAO' }],
    ['needsAttention que não é booleano', { needsAttention: 'talvez' }],
    ['search com mais de 100 caracteres', { search: 'x'.repeat(101) }],
    ['parâmetro desconhecido', { ordenarPor: 'valor' }],
  ])('recusa %s com 400 VALIDACAO_INVALIDA', async (_desc, query) => {
    const res = await list(query);
    expectApiError(res, 400, 'VALIDACAO_INVALIDA');
  });
});
