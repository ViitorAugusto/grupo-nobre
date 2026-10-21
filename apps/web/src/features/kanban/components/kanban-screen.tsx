'use client';

import { SearchX } from 'lucide-react';
import { useMeta } from '@/shared/api/meta';
import { useOpportunities } from '@/shared/api/opportunities';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { useOpportunityDetailParam } from '@/shared/hooks/use-search-param-state';
import { Button } from '@/shared/ui/button';
import { useKanbanFilters } from '../hooks/use-kanban-filters';
import { FilterBar } from './filter-bar';
import { KanbanBoard } from './kanban-board';
import { KanbanSkeleton } from './kanban-skeleton';

export function KanbanScreen() {
  const filterState = useKanbanFilters();
  const meta = useMeta();
  const opportunities = useOpportunities(filterState.filters);
  const detail = useOpportunityDetailParam();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <FilterBar state={filterState} />
      <KanbanContent
        meta={meta}
        opportunities={opportunities}
        hasActiveFilters={filterState.hasActiveFilters}
        onClearFilters={filterState.clearFilters}
        onOpen={detail.open}
      />
    </div>
  );
}

type KanbanContentProps = {
  meta: ReturnType<typeof useMeta>;
  opportunities: ReturnType<typeof useOpportunities>;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onOpen: (id: string) => void;
};

function KanbanContent({
  meta,
  opportunities,
  hasActiveFilters,
  onClearFilters,
  onOpen,
}: KanbanContentProps) {
  if (meta.isError || opportunities.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar as oportunidades."
        error={meta.error ?? opportunities.error}
        onRetry={() => {
          if (meta.isError) void meta.refetch();
          void opportunities.refetch();
        }}
      />
    );
  }

  if (!meta.data || !opportunities.data) return <KanbanSkeleton />;

  const isEmpty = opportunities.data.length === 0;
  const stages = [...meta.data.stages].sort((a, b) => a.order - b.order);

  return (
    <>
      {isEmpty && hasActiveFilters && (
        <EmptyState
          icon={SearchX}
          title="Nenhuma oportunidade com esses filtros"
          action={
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          }
        />
      )}
      {isEmpty && !hasActiveFilters && (
        <EmptyState
          title="Nenhuma oportunidade no funil ainda"
          description="Quando houver oportunidades, elas aparecem aqui, cada uma na sua etapa."
        />
      )}
      <KanbanBoard stages={stages} opportunities={opportunities.data} onOpen={onOpen} />
    </>
  );
}
