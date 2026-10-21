import type { QueueRunView } from '../application/generate-follow-up-queue.use-case.js';
import type { SellerQueueView } from '../application/get-seller-queue.use-case.js';
import type { SummaryView } from '../application/list-summaries.use-case.js';
import type { QueueItem } from '../domain/follow-up-queue.js';
import type {
  QueueItemResponse,
  QueueRunResponse,
  SellerQueueResponse,
  SummaryResponse,
} from './follow-up-queue.responses.js';

export function presentQueueRun(run: QueueRunView): QueueRunResponse {
  return { date: run.date, generatedAt: run.generatedAt.toISOString(), sellers: run.sellers };
}

function presentQueueItem({ position, opportunity, reasons }: QueueItem): QueueItemResponse {
  const { id, code, company, estimatedValue } = opportunity;
  return { position, opportunity: { id, code, company, estimatedValue }, reasons };
}

export function presentSellerQueue(queue: SellerQueueView): SellerQueueResponse {
  return {
    date: queue.date,
    seller: queue.seller,
    generatedAt: queue.generatedAt?.toISOString() ?? null,
    items: queue.items.map(presentQueueItem),
  };
}

export function presentSummary(summary: SummaryView): SummaryResponse {
  return {
    date: summary.date,
    seller: summary.seller,
    text: summary.text,
    createdAt: summary.createdAt.toISOString(),
  };
}
