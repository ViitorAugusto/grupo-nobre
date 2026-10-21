import { SEED_OPPORTUNITIES } from '../../../../prisma/seed-data.js';
import { buildOpportunity, PARAMS, TODAY } from '../testing/build-opportunity.js';
import { compareForBoard, matchesSearch, toOpportunityView } from './opportunity-view.js';

describe('Seed do case com hoje = 2026-10-15 (ADR-002)', () => {
  const views = SEED_OPPORTUNITIES.map((seed) =>
    toOpportunityView(
      buildOpportunity({
        code: seed.code,
        stage: seed.stage,
        lastContactDate: seed.lastContactDate,
        proposalValidUntil: seed.proposalValidUntil,
        eventDate: seed.eventDate,
      }),
      TODAY,
      PARAMS,
    ),
  );

  it.each([
    ['OPP-2001', []],
    ['OPP-2002', ['Proposta vencida há 2 dias', '9 dias sem contato']],
    ['OPP-2003', ['Evento em 3 dias', 'Validade após o evento']],
    ['OPP-2004', ['Proposta vencida há 5 dias', '13 dias sem contato']],
    ['OPP-2005', []],
    ['OPP-2006', []],
    ['OPP-2007', []],
  ])('%s tem os motivos %j', (code, messages) => {
    const view = views.find((v) => v.opportunity.code === code)!;
    expect(view.attention.reasons.map((reason) => reason.message)).toEqual(messages);
    expect(view.attention.needsAttention).toBe(messages.length > 0);
  });
});

describe('Busca por código ou empresa', () => {
  const opportunity = buildOpportunity({ code: 'OPP-2003', company: 'Clínica Vida' });

  it.each(['clinica', 'CLÍNICA', 'vida', 'opp-2003', '2003'])('encontra com "%s"', (term) => {
    expect(matchesSearch(opportunity, term)).toBe(true);
  });

  it('não encontra termo ausente', () => {
    expect(matchesSearch(opportunity, 'padaria')).toBe(false);
  });
});

describe('Ordem do quadro (ADR-005)', () => {
  function view(code: string, overrides: Parameters<typeof buildOpportunity>[0]) {
    return toOpportunityView(buildOpportunity({ code, ...overrides }), TODAY, PARAMS);
  }

  it('etapa → atenção primeiro → evento mais próximo (nulos por último) → código', () => {
    const list = [
      view('OPP-6', { stage: 'FORECAST' }),
      view('OPP-5', { stage: 'FOLLOW_UP', eventDate: null }),
      view('OPP-4', { stage: 'FOLLOW_UP', eventDate: '2026-12-01' }),
      view('OPP-3', { stage: 'FOLLOW_UP', eventDate: '2026-11-01' }),
      view('OPP-2', { stage: 'FOLLOW_UP', eventDate: '2026-11-01' }),
      view('OPP-1', { stage: 'FOLLOW_UP', lastContactDate: '2026-10-01', eventDate: '2026-12-31' }),
      view('OPP-0', { stage: 'PRIMEIRO_CONTATO' }),
    ];
    expect(list.sort(compareForBoard).map((v) => v.opportunity.code)).toEqual([
      'OPP-0',
      'OPP-1',
      'OPP-2',
      'OPP-3',
      'OPP-4',
      'OPP-5',
      'OPP-6',
    ]);
  });
});
