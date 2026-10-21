import { AlertTriangle } from 'lucide-react';
import type { AttentionReason } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';

type AttentionBadgeProps = {
  reasons: AttentionReason[];
  mode?: 'summary' | 'all';
  className?: string;
};

const badgeClass =
  'inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning';

export function AttentionBadge({ reasons, mode = 'summary', className }: AttentionBadgeProps) {
  if (reasons.length === 0) return null;

  if (mode === 'all') {
    return (
      <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="Motivos de atenção">
        {reasons.map((reason) => (
          <li key={reason.code} className={badgeClass}>
            <AlertTriangle className="size-3.5" aria-hidden />
            {reason.message}
          </li>
        ))}
      </ul>
    );
  }

  const [main, ...others] = reasons;
  const allMessages = reasons.map((reason) => reason.message).join(' · ');
  return (
    <span
      className={cn(badgeClass, className)}
      title={allMessages}
      aria-label={`Precisa de atenção: ${allMessages}`}
    >
      <AlertTriangle className="size-3.5" aria-hidden />
      <span aria-hidden>{main.message}</span>
      {others.length > 0 && (
        <span className="text-warning/80" aria-hidden>
          +{others.length}
        </span>
      )}
    </span>
  );
}
