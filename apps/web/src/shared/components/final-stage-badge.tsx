'use client';

import { CircleCheck, CircleX } from 'lucide-react';
import { useMeta } from '@/shared/api/meta';
import type { Opportunity } from '@/shared/api/types';
import { lossReasonLabel } from '@/shared/lib/labels';

type FinalStageBadgeProps = Pick<Opportunity, 'stage' | 'lossReason' | 'lossReasonText'>;

export function FinalStageBadge({ stage, lossReason, lossReasonText }: FinalStageBadgeProps) {
  const { data: meta } = useMeta();

  if (stage === 'FECHAMENTO') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        <CircleCheck className="size-3.5" aria-hidden />
        Fechada
      </span>
    );
  }

  if (stage === 'PERDIDA') {
    const reason = lossReason ? lossReasonLabel(meta, lossReason) : 'Motivo não informado';
    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <CircleX className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">Perdida: {lossReasonText ?? reason}</span>
      </span>
    );
  }

  return null;
}
