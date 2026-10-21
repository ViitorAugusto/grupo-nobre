import { ATTENTION_PRIORITY } from '../../opportunities/domain/attention.js';
import type { QueueEntry, QueueItem } from './follow-up-queue.js';

function topPriority(entry: QueueEntry): number {
  return Math.min(...entry.reasons.map((reason) => ATTENTION_PRIORITY.indexOf(reason.rule)));
}

function valueOf(entry: QueueEntry): number {
  return entry.opportunity.estimatedValue ?? Number.NEGATIVE_INFINITY;
}

export function compareQueueEntries(a: QueueEntry, b: QueueEntry): number {
  return (
    topPriority(a) - topPriority(b) ||
    valueOf(b) - valueOf(a) ||
    a.opportunity.code.localeCompare(b.opportunity.code)
  );
}

export function rankQueue(entries: readonly QueueEntry[]): QueueItem[] {
  return [...entries]
    .sort(compareQueueEntries)
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}
