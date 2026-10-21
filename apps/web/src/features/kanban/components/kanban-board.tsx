'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useMutationState } from '@tanstack/react-query';
import { useState } from 'react';
import { moveStageMutationKey, type MoveStageVariables } from '@/shared/api/opportunities';
import type { Opportunity, Stage, StageMeta } from '@/shared/api/types';
import { LossReasonDialog } from '@/shared/components/loss-reason-dialog';
import { useStageMoveFlow } from '@/shared/hooks/use-stage-move-flow';
import { KanbanColumn } from './kanban-column';
import { OpportunityCard, OpportunityCardBody } from './opportunity-card';

type KanbanBoardProps = {
  stages: StageMeta[];
  opportunities: Opportunity[];
  onOpen: (id: string) => void;
};

export function KanbanBoard({ stages, opportunities, onOpen }: KanbanBoardProps) {
  const { requestMove, lossDialog } = useStageMoveFlow();
  const [dragging, setDragging] = useState<Opportunity | null>(null);
  const pendingIds = useMutationState({
    filters: { mutationKey: moveStageMutationKey, status: 'pending' },
    select: (mutation) => (mutation.state.variables as MoveStageVariables).opportunity.id,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setDragging(event.active.data.current?.opportunity ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null);
    const opportunity = event.active.data.current?.opportunity as Opportunity | undefined;
    const toStage = event.over?.data.current?.stage as Stage | undefined;
    if (opportunity && toStage) requestMove(opportunity, toStage);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div
          className="flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-4 sm:snap-none"
          aria-label="Quadro de oportunidades"
        >
          {stages.map((stage) => {
            const inStage = opportunities.filter((item) => item.stage === stage.code);
            return (
              <KanbanColumn
                key={stage.code}
                stage={stage}
                opportunities={inStage}
                highlighted={dragging?.allowedTransitions.includes(stage.code) ?? false}
              >
                {inStage.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    pending={pendingIds.includes(opportunity.id)}
                    onOpen={onOpen}
                    onMove={requestMove}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>
        <DragOverlay>
          {dragging && (
            <div className="w-72 rotate-2 cursor-grabbing">
              <OpportunityCardBody opportunity={dragging} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      <LossReasonDialog {...lossDialog} />
    </>
  );
}
