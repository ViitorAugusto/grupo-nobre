import { httpClient } from '@/shared/api/http-client';
import type { SellerQueue } from '@/shared/api/types';

export const followUpQueueKeys = {
  all: ['follow-up-queue'] as const,
  seller: (sellerId: string) => [...followUpQueueKeys.all, sellerId] as const,
};

export const followUpQueueApi = {
  getForSeller: (sellerId: string, signal?: AbortSignal) =>
    httpClient.get<SellerQueue>('/follow-up-queue', { signal, query: { sellerId } }),
  generate: () => httpClient.post<unknown>('/follow-up-queue/runs', {}),
};
