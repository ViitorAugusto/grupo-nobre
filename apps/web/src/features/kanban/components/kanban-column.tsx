'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Opportunity, StageMeta } from '@/shared/api/types';
import { EmptyState } from '@/shared/components/empty-state';
import { cn } from '@/shared/lib/cn';
import { formatMoney, pluralize } from '@/shared/lib/format';
import type { ReactNode } from 'react';

type KanbanColumnProps = {
  stage: StageMeta;
  opportunities: Opportunity[];
  highlighted: boolean;
  children: ReactNode;
};

export function KanbanColumn({ stage, opportunities, highlighted, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.code, data: { stage: stage.code } });
  const total = opportunities.reduce((sum, item) => sum + (item.estimatedValue ?? 0), 0);
  const headingId = `column-${stage.code}`;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cn(
        'flex w-[85vw] max-w-72 shrink-0 snap-start flex-col rounded-xl bg-secondary sm:w-72',
        highlighted && 'ring-2 ring-primary',
        isOver && highlighted && 'bg-accent',
      )}
    >
      <header className="flex items-baseline justify-between gap-2 px-3 py-2">
        <h2 id={headingId} className="text-sm font-semibold">
          {stage.label}{' '}
          <span
            className="text-muted-foreground"
            aria-label={pluralize(opportunities.length, 'oportunidade', 'oportunidades')}
          >
            · {opportunities.length}
          </span>
        </h2>
        <span className="font-data text-xs tabular-nums text-muted-foreground">
          {formatMoney(total)}
        </span>
      </header>
      <div className={cn('flex flex-1 flex-col p-2', stage.isFinal && 'opacity-80')}>
        {opportunities.length === 0 ? (
          <EmptyState title="Nenhuma oportunidade nesta etapa" className="py-6" />
        ) : (
          <ol className="flex flex-col gap-2">{children}</ol>
        )}
      </div>
    </section>
  );
}
