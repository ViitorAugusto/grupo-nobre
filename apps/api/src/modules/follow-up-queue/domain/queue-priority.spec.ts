import { buildOpportunity, PARAMS, TODAY } from '../../opportunities/testing/build-opportunity.js';
import { selectForQueue } from './follow-up-queue.js';
import { rankQueue } from './queue-priority.js';

type Overrides = Parameters<typeof buildOpportunity>[0];

const ONLY: Record<'A1' | 'A2' | 'A3' | 'A4', Overrides> = {
  A3: { stage: 'FOLLOW_UP', eventDate: '2026-10-18' },
  A1: { stage: 'FOLLOW_UP', proposalValidUntil: '2026-10-13' },
  A4: { stage: 'FOLLOW_UP', proposalValidUntil: '2026-12-20', eventDate: '2026-12-10' },
  A2: { stage: 'FOLLOW_UP', lastContactDate: '2026-10-01' },
};

function queueCodes(...overrides: Overrides[]): string[] {
  const candidates = overrides.map((o, i) => buildOpportunity({ code: `OPP-${3000 + i}`, ...o }));
  return rankQueue(selectForQueue(candidates, TODAY, PARAMS)).map((item) => item.opportunity.code);
}

describe('T1 — prioridade do motivo', () => {
  it.each([
    ['A3', 'A1'],
    ['A1', 'A4'],
    ['A4', 'A2'],
  ] as const)('%s vem antes de %s, mesmo com menor valor', (first, second) => {
    const codes = queueCodes(
      { ...ONLY[second], code: 'OPP-0001', estimatedValue: 99_000 },
      { ...ONLY[first], code: 'OPP-0002', estimatedValue: 100 },
    );
    expect(codes).toEqual(['OPP-0002', 'OPP-0001']);
  });

  it('ordem completa A3 → A1 → A4 → A2', () => {
    const codes = queueCodes(
      { ...ONLY.A2, code: 'OPP-0004' },
      { ...ONLY.A4, code: 'OPP-0003' },
      { ...ONLY.A1, code: 'OPP-0002' },
      { ...ONLY.A3, code: 'OPP-0001' },
    );
    expect(codes).toEqual(['OPP-0001', 'OPP-0002', 'OPP-0003', 'OPP-0004']);
  });
});

describe('T2 — desempate', () => {
  it('mesma regra: maior valor estimado primeiro', () => {
    const codes = queueCodes(
      { ...ONLY.A1, code: 'OPP-0001', estimatedValue: 3900 },
      { ...ONLY.A1, code: 'OPP-0002', estimatedValue: 9800 },
    );
    expect(codes).toEqual(['OPP-0002', 'OPP-0001']);
  });

  it('mesma regra e mesmo valor: código crescente', () => {
    const codes = queueCodes(
      { ...ONLY.A2, code: 'OPP-0009', estimatedValue: 5000 },
      { ...ONLY.A2, code: 'OPP-0003', estimatedValue: 5000 },
    );
    expect(codes).toEqual(['OPP-0003', 'OPP-0009']);
  });

  it('sem valor estimado vai depois de quem tem valor, na mesma regra', () => {
    const codes = queueCodes(
      { ...ONLY.A2, code: 'OPP-0001', estimatedValue: null },
      { ...ONLY.A2, code: 'OPP-0002', estimatedValue: 10 },
    );
    expect(codes).toEqual(['OPP-0002', 'OPP-0001']);
  });
});

describe('T3 — vários motivos', () => {
  const multi = buildOpportunity({
    code: 'OPP-0001',
    stage: 'FOLLOW_UP',
    estimatedValue: 100,
    proposalValidUntil: '2026-10-13',
    lastContactDate: '2026-10-01',
  });
  const onlyA1Richer = buildOpportunity({ ...ONLY.A1, code: 'OPP-0002', estimatedValue: 50_000 });
  const onlyA4 = buildOpportunity({ ...ONLY.A4, code: 'OPP-0003', estimatedValue: 90_000 });
  const queue = rankQueue(selectForQueue([onlyA4, multi, onlyA1Richer], TODAY, PARAMS));

  it('entra uma vez só', () => {
    expect(queue.filter((item) => item.opportunity.code === 'OPP-0001')).toHaveLength(1);
  });

  it('fica na posição do motivo mais prioritário (A1), não do A2', () => {
    expect(queue.map((item) => [item.position, item.opportunity.code])).toEqual([
      [1, 'OPP-0002'],
      [2, 'OPP-0001'],
      [3, 'OPP-0003'],
    ]);
  });

  it('lista todos os motivos, em ordem de prioridade', () => {
    expect(queue[1].reasons.map((reason) => reason.rule)).toEqual(['A1', 'A2']);
  });
});

describe('posições', () => {
  it('são numeradas a partir de 1, sem buracos', () => {
    const queue = rankQueue(
      selectForQueue(
        [ONLY.A2, ONLY.A3, ONLY.A1].map((o, i) => buildOpportunity({ code: `OPP-000${i}`, ...o })),
        TODAY,
        PARAMS,
      ),
    );
    expect(queue.map((item) => item.position)).toEqual([1, 2, 3]);
  });
});
