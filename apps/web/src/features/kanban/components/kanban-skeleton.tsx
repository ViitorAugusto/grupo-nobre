import { Skeleton } from '@/shared/ui/skeleton';

const COLUMNS = 6;
const CARDS_PER_COLUMN = [2, 1, 2, 1, 1, 1];

export function KanbanSkeleton() {
  return (
    <div
      className="flex gap-3 overflow-hidden pb-4"
      role="status"
      aria-label="Carregando oportunidades"
    >
      {Array.from({ length: COLUMNS }, (_, column) => (
        <div
          key={column}
          className="flex w-[85vw] max-w-72 shrink-0 flex-col rounded-xl bg-secondary sm:w-72"
        >
          <div className="flex items-center justify-between px-3 py-2.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: CARDS_PER_COLUMN[column] }, (_, card) => (
              <div key={card} className="rounded-lg border bg-card p-3 shadow-sm">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="mt-2 h-4 w-40" />
                <Skeleton className="mt-1.5 h-3 w-48" />
                <Skeleton className="mt-3 h-5 w-36 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
