'use client';

import { Loader2, PhoneCall } from 'lucide-react';
import type { FollowUpQueueItem as QueueItem } from '@/shared/api/types';
import { AttentionBadge } from '@/shared/components/attention-badge';
import { Money } from '@/shared/components/money';
import { Button } from '@/shared/ui/button';

type FollowUpQueueItemProps = {
  item: QueueItem;
  registering: boolean;
  onOpen: (id: string) => void;
  onRegisterContact: () => void;
};

export function FollowUpQueueItem({
  item,
  registering,
  onOpen,
  onRegisterContact,
}: FollowUpQueueItemProps) {
  const { opportunity } = item;
  return (
    <li className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm sm:flex-row sm:items-start">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-data text-xs font-semibold text-primary-foreground"
        aria-label={`Posição ${item.position}`}
      >
        {item.position}
      </span>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen(opportunity.id)}
          className="rounded-sm text-left text-sm font-medium hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="font-data text-muted-foreground">{opportunity.code}</span> ·{' '}
          {opportunity.company}
        </button>
        <Money value={opportunity.estimatedValue} className="block text-sm text-muted-foreground" />
        <AttentionBadge reasons={item.reasons} mode="all" className="mt-2" />
      </div>
      <Button size="sm" onClick={onRegisterContact} disabled={registering} className="max-sm:h-11">
        {registering ? <Loader2 className="animate-spin" aria-hidden /> : <PhoneCall aria-hidden />}
        {registering ? 'Registrando…' : 'Registrar contato'}
      </Button>
    </li>
  );
}
