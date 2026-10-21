'use client';

import { CalendarDays } from 'lucide-react';
import { useMeta } from '@/shared/api/meta';
import { formatCalendarDate } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';

export function ReferenceDateBanner() {
  const { data: meta } = useMeta();
  if (!meta) return <Skeleton className="h-7 w-56 rounded-full" />;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-info/30 bg-info/10 px-3 py-1 text-xs text-info">
      <CalendarDays className="size-4" aria-hidden />
      Hoje: <span className="font-data">{formatCalendarDate(meta.referenceDate)}</span>{' '}
      (demonstração)
    </span>
  );
}
