import { parseCalendarDate } from '../../../shared/domain/calendar-date.js';
import type { Stage } from '../../opportunities/domain/stage.js';
import { buildOpportunity, PARAMS, TODAY } from '../../opportunities/testing/build-opportunity.js';
import { selectForQueue } from './follow-up-queue.js';

type Overrides = Parameters<typeof buildOpportunity>[0];

function rulesInQueue(overrides: Overrides, date = TODAY): string[][] {
  return selectForQueue([buildOpportunity(overrides)], date, PARAMS).map((entry) =>
    entry.reasons.map((reason) => reason.rule),
  );
}

describe('T4 — estados finais', () => {
  it.each(['FECHAMENTO', 'PERDIDA'] as Stage[])(
    '%s nunca entra, mesmo com todos os alertas',
    (stage) => {
      const overrides: Overrides = {
        stage,
        lastContactDate: '2026-10-01',
        proposalValidUntil: '2026-10-20',
        eventDate: '2026-10-17',
      };
      expect(rulesInQueue(overrides)).toEqual([]);
    },
  );
});

describe('T6 — baixa por contato (regra de seleção)', () => {
  const vencida: Overrides = {
    stage: 'APRESENTACAO_ORCAMENTO',
    proposalValidUntil: '2026-10-13',
    lastContactDate: '2026-10-15',
  };

  it('contato registrado na data tira da fila do dia, mesmo com proposta vencida', () => {
    expect(rulesInQueue(vencida)).toEqual([]);
  });

  it('no dia seguinte volta, se ainda precisar de atenção', () => {
    expect(rulesInQueue(vencida, parseCalendarDate('2026-10-16'))).toEqual([['A1']]);
  });
});

describe('T7 — bordas de A2', () => {
  it('5 dias sem contato: não entra', () => {
    expect(rulesInQueue({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-10' })).toEqual([]);
  });

  it('6 dias sem contato: entra por A2', () => {
    expect(rulesInQueue({ stage: 'FOLLOW_UP', lastContactDate: '2026-10-09' })).toEqual([['A2']]);
  });
});

describe('T8 — bordas de A3', () => {
  it('8 dias até o evento: não entra', () => {
    expect(rulesInQueue({ stage: 'FOLLOW_UP', eventDate: '2026-10-23' })).toEqual([]);
  });

  it('7 dias até o evento: entra por A3', () => {
    expect(rulesInQueue({ stage: 'FOLLOW_UP', eventDate: '2026-10-22' })).toEqual([['A3']]);
  });

  it('evento já passou e a etapa não é final: entra por A3', () => {
    const [entry] = selectForQueue(
      [buildOpportunity({ stage: 'FORECAST', eventDate: '2026-10-14' })],
      TODAY,
      PARAMS,
    );
    expect(entry.reasons).toEqual([
      { rule: 'A3', code: 'EVENTO_PROXIMO', message: 'Evento já passou há 1 dia', days: -1 },
    ]);
  });
});

describe('T9 — bordas de A1', () => {
  it('validade igual a hoje: não está vencida, não entra', () => {
    expect(rulesInQueue({ stage: 'FOLLOW_UP', proposalValidUntil: '2026-10-15' })).toEqual([]);
  });

  it('validade ontem: entra como vencida há 1 dia', () => {
    const [entry] = selectForQueue(
      [buildOpportunity({ stage: 'FOLLOW_UP', proposalValidUntil: '2026-10-14' })],
      TODAY,
      PARAMS,
    );
    expect(entry.reasons).toEqual([
      { rule: 'A1', code: 'PROPOSTA_VENCIDA', message: 'Proposta vencida há 1 dia', days: 1 },
    ]);
  });
});

describe('T10 — campos em branco', () => {
  it('sem validade: A1 e A4 não se aplicam (evento longe)', () => {
    expect(
      rulesInQueue({ stage: 'FOLLOW_UP', proposalValidUntil: null, eventDate: '2026-12-01' }),
    ).toEqual([]);
  });

  it('sem evento: A3 e A4 não se aplicam (validade futura)', () => {
    expect(
      rulesInQueue({ stage: 'FOLLOW_UP', eventDate: null, proposalValidUntil: '2026-12-01' }),
    ).toEqual([]);
  });

  it('sem último contato: A2 não se aplica', () => {
    expect(rulesInQueue({ stage: 'FOLLOW_UP', lastContactDate: null })).toEqual([]);
  });
});

describe('T11 — fila vazia', () => {
  it('sem nenhuma oportunidade com alerta, a fila é vazia', () => {
    const candidates = [
      buildOpportunity({ stage: 'PRIMEIRO_CONTATO', lastContactDate: '2026-10-14' }),
      buildOpportunity({ stage: 'FECHAMENTO', lastContactDate: '2026-10-01' }),
    ];
    expect(selectForQueue(candidates, TODAY, PARAMS)).toEqual([]);
  });
});
