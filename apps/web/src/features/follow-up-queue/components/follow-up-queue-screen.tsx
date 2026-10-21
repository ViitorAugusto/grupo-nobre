'use client';

import { CalendarClock, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSellers } from '@/shared/api/meta';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { useRegisterContactAction } from '@/shared/hooks/use-register-contact-action';
import {
  useOpportunityDetailParam,
  useSearchParamState,
} from '@/shared/hooks/use-search-param-state';
import { formatCalendarDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { useFollowUpQueue, useGenerateFollowUpQueue } from '../hooks/use-follow-up-queue';
import { FollowUpQueueItem } from './follow-up-queue-item';

const SELLER_PARAM = 'vendedor';

export function FollowUpQueueScreen() {
  const { searchParams, setParams } = useSearchParamState();
  const sellers = useSellers();
  const sellerId = searchParams.get(SELLER_PARAM) ?? sellers.data?.[0]?.id ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Retornos de hoje</h1>
        {sellers.data ? (
          <Select
            value={sellerId ?? undefined}
            onValueChange={(id) => setParams({ [SELLER_PARAM]: id })}
          >
            <SelectTrigger className="sm:w-56" aria-label="Vendedor">
              <SelectValue placeholder="Escolha o vendedor" />
            </SelectTrigger>
            <SelectContent>
              {sellers.data.map((seller) => (
                <SelectItem key={seller.id} value={seller.id}>
                  {seller.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          !sellers.isError && <Skeleton className="h-9 w-full sm:w-56" />
        )}
      </div>

      {sellers.isError ? (
        <ErrorState
          title="Não foi possível carregar os vendedores."
          error={sellers.error}
          onRetry={() => void sellers.refetch()}
        />
      ) : (
        sellerId && <SellerQueue sellerId={sellerId} />
      )}
    </div>
  );
}

function SellerQueue({ sellerId }: { sellerId: string }) {
  const queue = useFollowUpQueue(sellerId);
  const generate = useGenerateFollowUpQueue();
  const registerContact = useRegisterContactAction();
  const detail = useOpportunityDetailParam();

  if (queue.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar a fila de retornos."
        error={queue.error}
        onRetry={() => void queue.refetch()}
      />
    );
  }

  if (!queue.data) return <QueueSkeleton />;

  if (queue.data.generatedAt === null) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="A fila de hoje ainda não foi gerada"
        description="A rotina diária ainda não rodou para esta data."
        action={
          <Button
            onClick={() =>
              generate.mutate(undefined, { onError: (error) => toast.error(error.message) })
            }
            disabled={generate.isPending}
          >
            {generate.isPending && <Loader2 className="animate-spin" aria-hidden />}
            {generate.isPending ? 'Gerando…' : 'Gerar fila de hoje'}
          </Button>
        }
      />
    );
  }

  if (queue.data.items.length === 0) {
    return <EmptyState icon={CheckCircle2} title="Nenhum retorno pendente hoje" />;
  }

  return (
    <section aria-labelledby="queue-title" className="grid gap-2">
      <h2 id="queue-title" className="text-sm font-semibold">
        {queue.data.items.length === 1 ? '1 retorno' : `${queue.data.items.length} retornos`} para{' '}
        <span className="font-data">{formatCalendarDate(queue.data.date)}</span>
      </h2>
      <ol className="grid gap-2">
        {queue.data.items.map((item) => (
          <FollowUpQueueItem
            key={item.opportunity.id}
            item={item}
            registering={registerContact.pendingId === item.opportunity.id}
            onOpen={detail.open}
            onRegisterContact={() => registerContact.run(item.opportunity)}
          />
        ))}
      </ol>
    </section>
  );
}

function QueueSkeleton() {
  return (
    <div className="grid gap-2" role="status" aria-label="Carregando fila de retornos">
      <Skeleton className="h-4 w-40" />
      {[0, 1].map((key) => (
        <div key={key} className="flex gap-3 rounded-lg border bg-card p-3 shadow-sm">
          <Skeleton className="size-7 rounded-full" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-40 rounded-full" />
          </div>
          <Skeleton className="h-8 w-36" />
        </div>
      ))}
    </div>
  );
}
