'use client';

import { ArrowRight, History } from 'lucide-react';
import { useMeta } from '@/shared/api/meta';
import type { StageChange } from '@/shared/api/types';
import { formatInstant } from '@/shared/lib/format';
import { lossReasonLabel, stageLabel } from '@/shared/lib/labels';

export function StageHistory({ history }: { history: StageChange[] }) {
  const { data: meta } = useMeta();

  if (history.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="size-4" aria-hidden />
        Nenhuma mudança de etapa registrada ainda.
      </p>
    );
  }

  return (
    <ol className="grid gap-2 border-l-2 border-border pl-4">
      {history.map((change) => (
        <li key={change.id} className="text-sm">
          <p className="flex flex-wrap items-center gap-1.5">
            {stageLabel(meta, change.fromStage)}
            <ArrowRight className="size-3.5 text-muted-foreground" aria-label="para" />
            <span className="font-medium">{stageLabel(meta, change.toStage)}</span>
          </p>
          {change.lossReason && (
            <p className="text-xs text-muted-foreground">
              Motivo: {lossReasonLabel(meta, change.lossReason)}
              {change.lossReasonText && ` — ${change.lossReasonText}`}
            </p>
          )}
          <time dateTime={change.changedAt} className="font-data text-xs text-muted-foreground">
            {formatInstant(change.changedAt)}
          </time>
        </li>
      ))}
    </ol>
  );
}
