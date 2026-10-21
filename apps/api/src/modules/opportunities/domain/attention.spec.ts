import { buildOpportunity, PARAMS, TODAY } from '../testing/build-opportunity.js';
import { attentionFor, daysWithoutContact } from './attention.js';
import type { Stage } from './stage.js';

function reasonsOf(overrides: Parameters<typeof buildOpportunity>[0]) {
  return attentionFor(buildOpportunity(overrides), TODAY, PARAMS).reasons;
}

describe('A1 — proposta vencida', () => {
  it('não dispara com validade igual a hoje (a proposta ainda vale)', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', proposalValidUntil: '2026-10-15' })).toEqual([]);
  });

  it('dispara no singular com 1 dia de vencida', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', proposalValidUntil: '2026-10-14' })).toEqual([
      { rule: 'A1', code: 'PROPOSTA_VENCIDA', message: 'Proposta vencida há 1 dia', days: 1 },
    ]);
  });

  it('dispara no plural com 2 dias de vencida', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', proposalValidUntil: '2026-10-13' })).toEqual([
      { rule: 'A1', code: 'PROPOSTA_VENCIDA', message: 'Proposta vencida há 2 dias', days: 2 },
    ]);
  });

  it.each(['APRESENTACAO_ORCAMENTO', 'FOLLOW_UP', 'FORECAST'] as Stage[])('vale em %s', (stage) => {
    expect(reasonsOf({ stage, proposalValidUntil: '2026-10-10' })[0]?.rule).toBe('A1');
  });

  it('não vale em Primeiro Contato', () => {
    expect(reasonsOf({ stage: 'PRIMEIRO_CONTATO', proposalValidUntil: '2026-10-10' })).toEqual([]);
  });

  it('não se aplica sem validade', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', proposalValidUntil: null })).toEqual([]);
  });
});

describe('A2 — sem contato', () => {
  it('não dispara com exatamente 5 dias sem contato', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-10' })).toEqual([]);
  });

  it('dispara com 6 dias sem contato', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-09' })).toEqual([
      { rule: 'A2', code: 'SEM_CONTATO', message: '6 dias sem contato', days: 6 },
    ]);
  });

  it('usa o singular "1 dia sem contato" quando o limite permite', () => {
    const reasons = attentionFor(
      buildOpportunity({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-14' }),
      TODAY,
      { ...PARAMS, noContactDays: 0 },
    ).reasons;
    expect(reasons).toEqual([
      { rule: 'A2', code: 'SEM_CONTATO', message: '1 dia sem contato', days: 1 },
    ]);
  });

  it('não se aplica sem último contato', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', lastContactDate: null })).toEqual([]);
  });

  it('vale também em Primeiro Contato', () => {
    expect(reasonsOf({ stage: 'PRIMEIRO_CONTATO', lastContactDate: '2026-10-01' })[0]?.rule).toBe(
      'A2',
    );
  });
});

describe('A3 — evento próximo', () => {
  it('não dispara com 8 dias até o evento', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', eventDate: '2026-10-23' })).toEqual([]);
  });

  it('dispara com exatamente 7 dias até o evento', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', eventDate: '2026-10-22' })).toEqual([
      { rule: 'A3', code: 'EVENTO_PROXIMO', message: 'Evento em 7 dias', days: 7 },
    ]);
  });

  it('"Evento amanhã" com 1 dia', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', eventDate: '2026-10-16' })).toEqual([
      { rule: 'A3', code: 'EVENTO_PROXIMO', message: 'Evento amanhã', days: 1 },
    ]);
  });

  it('"Evento hoje" com 0 dias', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', eventDate: '2026-10-15' })).toEqual([
      { rule: 'A3', code: 'EVENTO_PROXIMO', message: 'Evento hoje', days: 0 },
    ]);
  });

  it('evento que passou há 1 dia, no singular e com dias negativos', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', eventDate: '2026-10-14' })).toEqual([
      { rule: 'A3', code: 'EVENTO_PROXIMO', message: 'Evento já passou há 1 dia', days: -1 },
    ]);
  });

  it('evento que passou há vários dias, no plural', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', eventDate: '2026-10-05' })).toEqual([
      { rule: 'A3', code: 'EVENTO_PROXIMO', message: 'Evento já passou há 10 dias', days: -10 },
    ]);
  });

  it('não se aplica sem data do evento', () => {
    expect(reasonsOf({ stage: 'FOLLOW_UP', eventDate: null })).toEqual([]);
  });
});

describe('A4 — validade após o evento', () => {
  it('dispara com validade posterior ao evento', () => {
    expect(
      reasonsOf({ stage: 'FOLLOW_UP', proposalValidUntil: '2026-11-20', eventDate: '2026-11-18' }),
    ).toEqual([
      { rule: 'A4', code: 'VALIDADE_APOS_EVENTO', message: 'Validade após o evento', days: null },
    ]);
  });

  it('não dispara com validade igual ao evento', () => {
    expect(
      reasonsOf({ stage: 'FOLLOW_UP', proposalValidUntil: '2026-11-18', eventDate: '2026-11-18' }),
    ).toEqual([]);
  });

  it('não se aplica sem validade ou sem evento', () => {
    expect(
      reasonsOf({ stage: 'FOLLOW_UP', proposalValidUntil: null, eventDate: '2026-11-18' }),
    ).toEqual([]);
    expect(
      reasonsOf({ stage: 'FOLLOW_UP', proposalValidUntil: '2026-11-20', eventDate: null }),
    ).toEqual([]);
  });
});

describe('Prioridade e estados finais', () => {
  it('ordena os motivos A3 → A1 → A4 → A2', () => {
    const reasons = reasonsOf({
      stage: 'FOLLOW_UP',
      lastContactDate: '2026-10-01',
      proposalValidUntil: '2026-10-20',
      eventDate: '2026-10-18',
    });
    expect(reasons.map((reason) => reason.rule)).toEqual(['A3', 'A4', 'A2']);

    const all = reasonsOf({
      stage: 'FOLLOW_UP',
      lastContactDate: '2026-10-01',
      proposalValidUntil: '2026-10-12',
      eventDate: '2026-10-10',
    });
    expect(all.map((reason) => reason.rule)).toEqual(['A3', 'A1', 'A4', 'A2']);
  });

  it.each(['FECHAMENTO', 'PERDIDA'] as Stage[])('%s nunca precisa de atenção', (stage) => {
    const attention = attentionFor(
      buildOpportunity({
        stage,
        lastContactDate: '2026-10-01',
        proposalValidUntil: '2026-10-12',
        eventDate: '2026-10-10',
      }),
      TODAY,
      PARAMS,
    );
    expect(attention).toEqual({ needsAttention: false, reasons: [] });
  });
});

describe('Dias sem contato', () => {
  it('conta dias desde o último contato, mesmo sem alerta', () => {
    expect(daysWithoutContact(buildOpportunity({ lastContactDate: '2026-10-14' }), TODAY)).toBe(1);
  });

  it('é null sem último contato', () => {
    expect(daysWithoutContact(buildOpportunity({ lastContactDate: null }), TODAY)).toBeNull();
  });
});
