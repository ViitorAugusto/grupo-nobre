'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useMeta } from '@/shared/api/meta';
import { useMoveStage } from '@/shared/api/opportunities';
import type { InputLossReason, Opportunity, Stage } from '@/shared/api/types';
import { stageLabel } from '@/shared/lib/labels';

export function useStageMoveFlow() {
  const { data: meta } = useMeta();
  const moveStage = useMoveStage();
  const [lossTarget, setLossTarget] = useState<Opportunity | null>(null);
  const [lossError, setLossError] = useState<string | null>(null);

  function notifySuccess(opportunity: Opportunity, toStage: Stage) {
    toast.success(`${opportunity.code} movida para ${stageLabel(meta, toStage)}`);
  }

  function requestMove(opportunity: Opportunity, toStage: Stage) {
    if (toStage === opportunity.stage) return;
    if (toStage === 'PERDIDA') {
      setLossError(null);
      setLossTarget(opportunity);
      return;
    }
    moveStage.mutate(
      { opportunity, input: { toStage } },
      {
        onSuccess: () => notifySuccess(opportunity, toStage),
        onError: (error) =>
          toast.error(error.message, {
            id: `move-${opportunity.id}`,
            action: error.isRetryable
              ? { label: 'Tentar novamente', onClick: () => requestMove(opportunity, toStage) }
              : undefined,
          }),
      },
    );
  }

  function confirmLoss(lossReason: InputLossReason, lossReasonText: string | undefined) {
    if (!lossTarget) return;
    const opportunity = lossTarget;
    setLossError(null);
    moveStage.mutate(
      { opportunity, input: { toStage: 'PERDIDA', lossReason, lossReasonText } },
      {
        onSuccess: () => {
          setLossTarget(null);
          notifySuccess(opportunity, 'PERDIDA');
        },
        onError: (error) => setLossError(error.message),
      },
    );
  }

  return {
    requestMove,
    lossDialog: {
      open: lossTarget !== null,
      opportunityCode: lossTarget?.code ?? '',
      reasons: meta?.lossReasons ?? [],
      pending: moveStage.isPending && lossTarget !== null,
      error: lossError,
      onConfirm: confirmLoss,
      onCancel: () => setLossTarget(null),
    },
  };
}
