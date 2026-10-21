import { DomainError } from '../../../shared/domain/domain-error.js';
import { buildOpportunity } from '../testing/build-opportunity.js';
import { decideStageChange } from './stage-change.js';
import type { Stage } from './stage.js';
import { allowedTransitionsFrom } from './stage-transition.js';

type Outcome = 'MUDA' | 'SEM_MUDANCA' | 'TRANSICAO_INVALIDA' | 'ESTADO_FINAL';

const PC = 'PRIMEIRO_CONTATO';
const AO = 'APRESENTACAO_ORCAMENTO';
const FU = 'FOLLOW_UP';
const FC = 'FORECAST';
const FE = 'FECHAMENTO';
const PE = 'PERDIDA';

const MATRIX: [Stage, Stage, Outcome][] = [
  [PC, PC, 'SEM_MUDANCA'],
  [PC, AO, 'MUDA'],
  [PC, FU, 'TRANSICAO_INVALIDA'],
  [PC, FC, 'TRANSICAO_INVALIDA'],
  [PC, FE, 'TRANSICAO_INVALIDA'],
  [PC, PE, 'MUDA'],

  [AO, PC, 'TRANSICAO_INVALIDA'],
  [AO, AO, 'SEM_MUDANCA'],
  [AO, FU, 'MUDA'],
  [AO, FC, 'TRANSICAO_INVALIDA'],
  [AO, FE, 'TRANSICAO_INVALIDA'],
  [AO, PE, 'MUDA'],

  [FU, PC, 'TRANSICAO_INVALIDA'],
  [FU, AO, 'MUDA'],
  [FU, FU, 'SEM_MUDANCA'],
  [FU, FC, 'MUDA'],
  [FU, FE, 'TRANSICAO_INVALIDA'],
  [FU, PE, 'MUDA'],

  [FC, PC, 'TRANSICAO_INVALIDA'],
  [FC, AO, 'MUDA'],
  [FC, FU, 'MUDA'],
  [FC, FC, 'SEM_MUDANCA'],
  [FC, FE, 'MUDA'],
  [FC, PE, 'MUDA'],

  [FE, PC, 'ESTADO_FINAL'],
  [FE, AO, 'ESTADO_FINAL'],
  [FE, FU, 'ESTADO_FINAL'],
  [FE, FC, 'ESTADO_FINAL'],
  [FE, FE, 'ESTADO_FINAL'],
  [FE, PE, 'ESTADO_FINAL'],

  [PE, PC, 'ESTADO_FINAL'],
  [PE, AO, 'ESTADO_FINAL'],
  [PE, FU, 'ESTADO_FINAL'],
  [PE, FC, 'ESTADO_FINAL'],
  [PE, FE, 'ESTADO_FINAL'],
  [PE, PE, 'ESTADO_FINAL'],
];

function outcomeOf(from: Stage, to: Stage): Outcome {
  const opportunity = buildOpportunity({ stage: from });
  try {
    const decision = decideStageChange(opportunity, { toStage: to, lossReason: 'PRECO' });
    return decision.kind === 'changed' ? 'MUDA' : 'SEM_MUDANCA';
  } catch (error) {
    if (error instanceof DomainError) return error.code as Outcome;
    throw error;
  }
}

describe('Matriz de transições (ADR-001)', () => {
  it('cobre as 36 células', () => {
    expect(MATRIX).toHaveLength(36);
  });

  it.each(MATRIX)('de %s para %s: %s', (from, to, expected) => {
    expect(outcomeOf(from, to)).toBe(expected);
  });

  it.each([
    [PC, [AO, PE]],
    [AO, [FU, PE]],
    [FU, [AO, FC, PE]],
    [FC, [AO, FU, FE, PE]],
    [FE, []],
    [PE, []],
  ] as [Stage, Stage[]][])(
    'allowedTransitions de %s segue a ordem das etapas',
    (from, expected) => {
      expect(allowedTransitionsFrom(from)).toEqual(expected);
    },
  );
});

describe('Mensagens de transição inválida', () => {
  function errorOf(from: Stage, to: Stage): DomainError {
    try {
      decideStageChange(buildOpportunity({ stage: from }), { toStage: to });
    } catch (error) {
      return error as DomainError;
    }
    throw new Error('era esperada uma recusa');
  }

  it('Fechamento fora de Forecast', () => {
    const error = errorOf(FU, FE);
    expect(error.message).toBe('Fechamento só pode ser aplicado a partir de Forecast.');
    expect(error.details).toEqual({ from: FU, to: FE });
  });

  it('pulo para frente indica o próximo passo', () => {
    expect(errorOf(PC, FC).message).toBe(
      'Avance uma etapa por vez: de Primeiro Contato o próximo passo é Apresentação de Orçamento.',
    );
  });

  it('retorno não permitido', () => {
    expect(errorOf(FC, PC).message).toBe(
      'Não é possível voltar de Forecast para Primeiro Contato.',
    );
  });

  it('estado final informa a etapa', () => {
    const error = errorOf(PE, FU);
    expect(error.message).toBe(
      'Oportunidade em Perdida é um estado final e não pode ser alterada.',
    );
    expect(error.details).toEqual({ stage: PE });
  });
});
