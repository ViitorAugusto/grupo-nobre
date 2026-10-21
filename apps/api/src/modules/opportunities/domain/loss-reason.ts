export const LOSS_REASONS = [
  'PRECO',
  'PRAZO',
  'CONCORRENCIA',
  'CLIENTE_DESISTIU',
  'SEM_RESPOSTA',
  'OUTRO',
  'NAO_REGISTRADO',
] as const;

export type LossReason = (typeof LOSS_REASONS)[number];

export interface LossReasonInfo {
  code: LossReason;
  label: string;
  requiresText: boolean;
  acceptedOnInput: boolean;
}

const LOSS_REASON_INFO: Record<LossReason, Omit<LossReasonInfo, 'code'>> = {
  PRECO: { label: 'Preço', requiresText: false, acceptedOnInput: true },
  PRAZO: { label: 'Prazo', requiresText: false, acceptedOnInput: true },
  CONCORRENCIA: { label: 'Concorrência', requiresText: false, acceptedOnInput: true },
  CLIENTE_DESISTIU: { label: 'Cliente desistiu', requiresText: false, acceptedOnInput: true },
  SEM_RESPOSTA: { label: 'Sem resposta', requiresText: false, acceptedOnInput: true },
  OUTRO: { label: 'Outro', requiresText: true, acceptedOnInput: true },
  NAO_REGISTRADO: {
    label: 'Não registrado (dado legado)',
    requiresText: false,
    acceptedOnInput: false,
  },
};

export const LOSS_REASON_CATALOG: readonly LossReasonInfo[] = LOSS_REASONS.map((code) => ({
  code,
  ...LOSS_REASON_INFO[code],
}));

export const INPUT_LOSS_REASONS: readonly LossReason[] = LOSS_REASONS.filter(
  (code) => LOSS_REASON_INFO[code].acceptedOnInput,
);

export function lossReasonRequiresText(reason: LossReason): boolean {
  return LOSS_REASON_INFO[reason].requiresText;
}
