import { invalidTransitionError } from './opportunity-errors.js';
import { STAGES, type Stage, stageLabel, stageOrder } from './stage.js';

const TRANSITIONS: Record<Stage, readonly Stage[]> = {
  PRIMEIRO_CONTATO: ['APRESENTACAO_ORCAMENTO', 'PERDIDA'],
  APRESENTACAO_ORCAMENTO: ['FOLLOW_UP', 'PERDIDA'],
  FOLLOW_UP: ['APRESENTACAO_ORCAMENTO', 'FORECAST', 'PERDIDA'],
  FORECAST: ['APRESENTACAO_ORCAMENTO', 'FOLLOW_UP', 'FECHAMENTO', 'PERDIDA'],
  FECHAMENTO: [],
  PERDIDA: [],
};

export function allowedTransitionsFrom(stage: Stage): Stage[] {
  return STAGES.filter((to) => TRANSITIONS[stage].includes(to));
}

export function isTransitionAllowed(from: Stage, to: Stage): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransitionAllowed(from: Stage, to: Stage): void {
  if (isTransitionAllowed(from, to)) return;

  if (to === 'FECHAMENTO') {
    throw invalidTransitionError(from, to, 'Fechamento só pode ser aplicado a partir de Forecast.');
  }
  if (stageOrder(to) > stageOrder(from)) {
    const next = STAGES[stageOrder(from)];
    throw invalidTransitionError(
      from,
      to,
      `Avance uma etapa por vez: de ${stageLabel(from)} o próximo passo é ${stageLabel(next)}.`,
    );
  }
  throw invalidTransitionError(
    from,
    to,
    `Não é possível voltar de ${stageLabel(from)} para ${stageLabel(to)}.`,
  );
}
