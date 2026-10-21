'use client';

import { useOpportunityDetail } from '@/shared/api/opportunities';
import { ErrorState } from '@/shared/components/error-state';
import { useOpportunityDetailParam } from '@/shared/hooks/use-search-param-state';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { OpportunityDetailView } from './opportunity-detail-view';

export function OpportunityDetailDialog() {
  const { openId, close } = useOpportunityDetailParam();
  const detail = useOpportunityDetail(openId);

  return (
    <Dialog open={openId !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-2xl">
        {detail.data ? (
          <OpportunityDetailView opportunity={detail.data} />
        ) : detail.isError ? (
          <>
            <DialogTitle>Detalhe da oportunidade</DialogTitle>
            <DialogDescription className="sr-only">Erro ao carregar</DialogDescription>
            <ErrorState
              title="Não foi possível carregar a oportunidade."
              error={detail.error}
              onRetry={() => void detail.refetch()}
            />
          </>
        ) : (
          <div role="status" aria-label="Carregando oportunidade" className="grid gap-3">
            <DialogTitle className="sr-only">Carregando oportunidade</DialogTitle>
            <DialogDescription className="sr-only">Carregando</DialogDescription>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
