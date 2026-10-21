import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FollowUpQueueScreen } from '@/features/follow-up-queue/components/follow-up-queue-screen';
import { OpportunityDetailDialog } from '@/features/opportunity-detail/components/opportunity-detail-dialog';

export const metadata: Metadata = { title: 'Retornos de hoje · CRM Nobre Brindes' };

export default function FollowUpQueuePage() {
  return (
    <main className="flex flex-1 flex-col p-4">
      <Suspense>
        <FollowUpQueueScreen />
        <OpportunityDetailDialog />
      </Suspense>
    </main>
  );
}
