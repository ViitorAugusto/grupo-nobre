import { buildOpportunity, PARAMS, TODAY } from '../../opportunities/testing/build-opportunity.js';
import { dailySummaryText } from './daily-summary.js';
import { selectForQueue } from './follow-up-queue.js';
import { rankQueue } from './queue-priority.js';

const opp2002 = buildOpportunity({
  code: 'OPP-2002',
  company: 'Construtora Horizonte',
  stage: 'APRESENTACAO_ORCAMENTO',
  estimatedValue: 9800,
  lastContactDate: '2026-10-06',
  proposalValidUntil: '2026-10-13',
  eventDate: '2026-10-25',
});

describe('Resumo do dia', () => {
  it('reproduz o exemplo da H5.4 para o Bruno', () => {
    const items = rankQueue(selectForQueue([opp2002], TODAY, PARAMS));

    expect(dailySummaryText('Bruno', TODAY, items)).toBe(
      'Bom dia, Bruno! Você tem 1 retorno hoje (15/10/2026):\n' +
        '1. OPP-2002 · Construtora Horizonte · R$ 9.800 — Proposta vencida há 2 dias; 9 dias sem contato',
    );
  });

  it('usa o plural e lista na ordem da fila', () => {
    const urgent = buildOpportunity({
      code: 'OPP-2010',
      company: 'Empresa X',
      stage: 'FOLLOW_UP',
      estimatedValue: 1234.5,
      eventDate: '2026-10-16',
    });
    const items = rankQueue(selectForQueue([opp2002, urgent], TODAY, PARAMS));

    expect(dailySummaryText('Bruno', TODAY, items)?.split('\n')).toEqual([
      'Bom dia, Bruno! Você tem 2 retornos hoje (15/10/2026):',
      '1. OPP-2010 · Empresa X · R$ 1.234,50 — Evento amanhã',
      '2. OPP-2002 · Construtora Horizonte · R$ 9.800 — Proposta vencida há 2 dias; 9 dias sem contato',
    ]);
  });

  it('T11 — vendedor sem pendências não recebe resumo', () => {
    expect(dailySummaryText('Ana', TODAY, [])).toBeNull();
  });
});
