import { ConflictError, DomainError, NotFoundError } from '../../../shared/domain/domain-error.js';
import { type Stage, stageLabel } from './stage.js';

export type CommercialField = 'estimatedValue' | 'items';

export function opportunityNotFound(id: string): NotFoundError {
  return new NotFoundError('Oportunidade não encontrada.', { id });
}

export function finalStageError(stage: Stage): DomainError {
  return new DomainError(
    'ESTADO_FINAL',
    `Oportunidade em ${stageLabel(stage)} é um estado final e não pode ser alterada.`,
    { stage },
  );
}

export function invalidTransitionError(from: Stage, to: Stage, message: string): DomainError {
  return new DomainError('TRANSICAO_INVALIDA', message, { from, to });
}

const MISSING_TEXT: Record<string, string> = {
  estimatedValue: 'o valor estimado',
  items: 'pelo menos 1 item',
  'estimatedValue,items': 'o valor estimado e pelo menos 1 item',
};

export function quoteRequirementsError(missing: CommercialField[]): DomainError {
  return new DomainError(
    'REQUISITOS_ORCAMENTO',
    `Para ir para Apresentação de Orçamento, informe ${MISSING_TEXT[missing.join(',')]}.`,
    { missing },
  );
}

export function keepQuoteRequirementsError(missing: CommercialField[]): DomainError {
  return new DomainError(
    'REQUISITOS_ORCAMENTO',
    'A partir de Apresentação de Orçamento a oportunidade precisa de valor estimado e pelo menos 1 item.',
    { missing },
  );
}

export function lossReasonRequiredError(): DomainError {
  return new DomainError('MOTIVO_PERDA_OBRIGATORIO', 'Informe o motivo da perda.');
}

export function lossReasonTextRequiredError(): DomainError {
  return new DomainError(
    'MOTIVO_PERDA_TEXTO_OBRIGATORIO',
    'Descreva o motivo da perda ao escolher "Outro".',
  );
}

export function stageChangedError(expected: Stage, current: Stage): ConflictError {
  return new ConflictError(
    'ETAPA_ALTERADA',
    'Esta oportunidade foi alterada enquanto você a movia. Recarregue e tente de novo.',
    { expected, current },
  );
}
