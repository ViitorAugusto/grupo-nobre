export const STAGES = [
  'PRIMEIRO_CONTATO',
  'APRESENTACAO_ORCAMENTO',
  'FOLLOW_UP',
  'FORECAST',
  'FECHAMENTO',
  'PERDIDA',
] as const;

export type Stage = (typeof STAGES)[number];

export interface StageInfo {
  code: Stage;
  label: string;
  order: number;
  isFinal: boolean;
}

const STAGE_INFO: Record<Stage, Omit<StageInfo, 'code'>> = {
  PRIMEIRO_CONTATO: { label: 'Primeiro Contato', order: 1, isFinal: false },
  APRESENTACAO_ORCAMENTO: { label: 'Apresentação de Orçamento', order: 2, isFinal: false },
  FOLLOW_UP: { label: 'Follow-up', order: 3, isFinal: false },
  FORECAST: { label: 'Forecast', order: 4, isFinal: false },
  FECHAMENTO: { label: 'Fechamento', order: 5, isFinal: true },
  PERDIDA: { label: 'Perdida', order: 6, isFinal: true },
};

export const STAGE_CATALOG: readonly StageInfo[] = STAGES.map((code) => ({
  code,
  ...STAGE_INFO[code],
}));

export function stageLabel(stage: Stage): string {
  return STAGE_INFO[stage].label;
}

export function stageOrder(stage: Stage): number {
  return STAGE_INFO[stage].order;
}

export function isFinalStage(stage: Stage): boolean {
  return STAGE_INFO[stage].isFinal;
}
