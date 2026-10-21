'use client';

import { useDraggable } from '@dnd-kit/core';
import { Loader2 } from 'lucide-react';
import type { Opportunity, Stage } from '@/shared/api/types';
import { AttentionBadge } from '@/shared/components/attention-badge';
import { FinalStageBadge } from '@/shared/components/final-stage-badge';
import { Money } from '@/shared/components/money';
import { MoveToMenu } from '@/shared/components/move-to-menu';
import { cn } from '@/shared/lib/cn';
import { formatDaysWithoutContact, pluralize } from '@/shared/lib/format';

type OpportunityCardProps = {
  opportunity: Opportunity;
  pending: boolean;
  onOpen: (id: string) => void;
  onMove: (opportunity: Opportunity, toStage: Stage) => void;
};

export function OpportunityCard({ opportunity, pending, onOpen, onMove }: OpportunityCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: opportunity.id,
    data: { opportunity },
    disabled: opportunity.isFinal || pending,
  });

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      tabIndex={-1}
      role="listitem"
      aria-roledescription={opportunity.isFinal ? undefined : 'card arrastável'}
      className={cn(
        'touch-manipulation',
        !opportunity.isFinal && !pending && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <OpportunityCardBody
        opportunity={opportunity}
        pending={pending}
        onOpen={onOpen}
        onMove={onMove}
      />
    </li>
  );
}

export function OpportunityCardBody({
  opportunity,
  pending = false,
  onOpen,
  onMove,
}: Partial<Pick<OpportunityCardProps, 'onOpen' | 'onMove' | 'pending'>> & {
  opportunity: Opportunity;
}) {
  const [mainItem, ...otherItems] = opportunity.items;
  const details = [
    mainItem &&
      (otherItems.length > 0
        ? `${mainItem.product} +${pluralize(otherItems.length, 'item', 'itens')}`
        : mainItem.product),
    opportunity.seller.name,
    !opportunity.isFinal &&
      opportunity.daysWithoutContact !== null &&
      formatDaysWithoutContact(opportunity.daysWithoutContact),
  ].filter(Boolean);

  return (
    <article
      aria-label={`${opportunity.code} · ${opportunity.company}`}
      aria-busy={pending}
      className={cn(
        'rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-accent/40',
        opportunity.attention.needsAttention && 'border-warning/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-data text-xs font-medium text-muted-foreground">
          {opportunity.code}
        </span>
        <Money value={opportunity.estimatedValue} className="text-sm font-semibold" />
      </div>

      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(opportunity.id)}
          className="mt-1 block w-full rounded-sm text-left text-sm font-medium hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {opportunity.company}
        </button>
      ) : (
        <p className="mt-1 text-sm font-medium">{opportunity.company}</p>
      )}
      <p className="text-xs text-muted-foreground">{details.join(' · ')}</p>

      {(opportunity.attention.needsAttention || opportunity.isFinal) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <AttentionBadge reasons={opportunity.attention.reasons} />
          <FinalStageBadge {...opportunity} />
        </div>
      )}

      {pending ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Movendo…
        </p>
      ) : (
        onMove && (
          <div className="mt-2 flex justify-end" onPointerDown={(event) => event.stopPropagation()}>
            <MoveToMenu
              opportunity={opportunity}
              onMove={(toStage) => onMove(opportunity, toStage)}
              className="h-8 max-sm:h-11"
            />
          </div>
        )
      )}
    </article>
  );
}
