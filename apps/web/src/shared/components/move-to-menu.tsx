'use client';

import { ArrowRightLeft } from 'lucide-react';
import { useMeta } from '@/shared/api/meta';
import type { Opportunity, Stage } from '@/shared/api/types';
import { stageLabel } from '@/shared/lib/labels';
import { Button, type ButtonProps } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/shared/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';

type MoveToMenuProps = {
  opportunity: Opportunity;
  onMove: (toStage: Stage) => void;
  disabled?: boolean;
  size?: ButtonProps['size'];
  className?: string;
};

export function MoveToMenu({
  opportunity,
  onMove,
  disabled,
  size = 'sm',
  className,
}: MoveToMenuProps) {
  const { data: meta } = useMeta();
  if (opportunity.allowedTransitions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={disabled}
          className={className}
          aria-label={`Mover ${opportunity.code} para…`}
        >
          <ArrowRightLeft aria-hidden />
          Mover para…
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mover {opportunity.code} para</DropdownMenuLabel>
        {opportunity.allowedTransitions.map((stage) => (
          <DropdownMenuItem key={stage} onSelect={() => onMove(stage)}>
            {stageLabel(meta, stage)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
