import {
  LEGACY_LOSS_REASON_LABEL,
  type LossReason,
  type Meta,
  type Stage,
} from '@/shared/api/types';

export function stageLabel(meta: Meta | undefined, stage: Stage): string {
  return meta?.stages.find((item) => item.code === stage)?.label ?? stage;
}

export function lossReasonLabel(meta: Meta | undefined, reason: LossReason): string {
  if (reason === 'NAO_REGISTRADO') return LEGACY_LOSS_REASON_LABEL;
  return meta?.lossReasons.find((item) => item.code === reason)?.label ?? reason;
}
