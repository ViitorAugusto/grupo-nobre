import { buildOpportunity } from '../testing/build-opportunity.js';
import { decideStageChange } from './stage-change.js';
import type { Stage } from './stage.js';

describe('Requisitos de Apresentação de Orçamento (ADR-001 ¹)', () => {
  it.each([
    ['sem valor', { estimatedValue: null }, ['estimatedValue'], 'o valor estimado'],
    ['sem item', { items: [] }, ['items'], 'pelo menos 1 item'],
    [
      'sem valor e sem item',
      { estimatedValue: null, items: [] },
      ['estimatedValue', 'items'],
      'o valor estimado e pelo menos 1 item',
    ],
  ])('recusa entrada %s, dizendo o que falta', (_, overrides, missing, text) => {
    const opportunity = buildOpportunity({ stage: 'PRIMEIRO_CONTATO', ...overrides });
    expect(() => decideStageChange(opportunity, { toStage: 'APRESENTACAO_ORCAMENTO' })).toThrow(
      expect.objectContaining({
        code: 'REQUISITOS_ORCAMENTO',
        message: `Para ir para Apresentação de Orçamento, informe ${text}.`,
        details: { missing },
      }),
    );
  });

  it.each(['FOLLOW_UP', 'FORECAST'] as Stage[])(
    'vale também no retorno de %s para revisão',
    (from) => {
      const opportunity = buildOpportunity({ stage: from, items: [] });
      expect(() => decideStageChange(opportunity, { toStage: 'APRESENTACAO_ORCAMENTO' })).toThrow(
        expect.objectContaining({ code: 'REQUISITOS_ORCAMENTO' }),
      );
    },
  );

  it('aceita com valor e pelo menos 1 item e gera o histórico', () => {
    const decision = decideStageChange(buildOpportunity({ stage: 'PRIMEIRO_CONTATO' }), {
      toStage: 'APRESENTACAO_ORCAMENTO',
    });
    expect(decision).toMatchObject({
      kind: 'changed',
      opportunity: { stage: 'APRESENTACAO_ORCAMENTO' },
      historyEntry: {
        fromStage: 'PRIMEIRO_CONTATO',
        toStage: 'APRESENTACAO_ORCAMENTO',
        lossReason: null,
        lossReasonText: null,
      },
    });
  });

  it('a matriz é checada antes dos requisitos', () => {
    const opportunity = buildOpportunity({ stage: 'APRESENTACAO_ORCAMENTO', items: [] });
    expect(() => decideStageChange(opportunity, { toStage: 'FORECAST' })).toThrow(
      expect.objectContaining({ code: 'TRANSICAO_INVALIDA' }),
    );
  });
});

describe('Motivo de perda (ADR-001 ²)', () => {
  const followUp = buildOpportunity({ stage: 'FOLLOW_UP' });

  it('recusa Perdida sem motivo', () => {
    expect(() => decideStageChange(followUp, { toStage: 'PERDIDA' })).toThrow(
      expect.objectContaining({
        code: 'MOTIVO_PERDA_OBRIGATORIO',
        message: 'Informe o motivo da perda.',
      }),
    );
  });

  it.each([undefined, null, '   '])('recusa "Outro" com texto %j', (lossReasonText) => {
    expect(() =>
      decideStageChange(followUp, { toStage: 'PERDIDA', lossReason: 'OUTRO', lossReasonText }),
    ).toThrow(
      expect.objectContaining({
        code: 'MOTIVO_PERDA_TEXTO_OBRIGATORIO',
        message: 'Descreva o motivo da perda ao escolher "Outro".',
      }),
    );
  });

  it('aceita motivo da lista e o registra na oportunidade e no histórico', () => {
    const decision = decideStageChange(followUp, { toStage: 'PERDIDA', lossReason: 'PRECO' });
    expect(decision).toMatchObject({
      kind: 'changed',
      opportunity: { stage: 'PERDIDA', lossReason: 'PRECO', lossReasonText: null },
      historyEntry: { fromStage: 'FOLLOW_UP', toStage: 'PERDIDA', lossReason: 'PRECO' },
    });
  });

  it('aceita "Outro" com texto, sem espaços nas pontas', () => {
    const decision = decideStageChange(followUp, {
      toStage: 'PERDIDA',
      lossReason: 'OUTRO',
      lossReasonText: '  Fornecedor interno  ',
    });
    expect(decision).toMatchObject({
      opportunity: { lossReason: 'OUTRO', lossReasonText: 'Fornecedor interno' },
      historyEntry: { lossReason: 'OUTRO', lossReasonText: 'Fornecedor interno' },
    });
  });

  it('mesma etapa não muda nada e não gera histórico', () => {
    expect(decideStageChange(followUp, { toStage: 'FOLLOW_UP' })).toEqual({ kind: 'unchanged' });
  });
});
