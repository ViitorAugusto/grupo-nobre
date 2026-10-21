import { Suspense } from 'react';
import { KanbanScreen } from '@/features/kanban/components/kanban-screen';
import { KanbanSkeleton } from '@/features/kanban/components/kanban-skeleton';
import { OpportunityDetailDialog } from '@/features/opportunity-detail/components/opportunity-detail-dialog';

export default function KanbanPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Oportunidades</h1>
      <Suspense fallback={<KanbanSkeleton />}>
        <KanbanScreen />
        <OpportunityDetailDialog />
      </Suspense>
    </main>
  );
}
