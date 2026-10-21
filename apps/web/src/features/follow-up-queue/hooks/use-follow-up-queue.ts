'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/api-error';
import { followUpQueueApi, followUpQueueKeys } from '../api/follow-up-queue-api';

export function useFollowUpQueue(sellerId: string | null) {
  return useQuery({
    queryKey: followUpQueueKeys.seller(sellerId ?? ''),
    queryFn: ({ signal }) => followUpQueueApi.getForSeller(sellerId as string, signal),
    enabled: sellerId !== null,
  });
}

export function useGenerateFollowUpQueue() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError>({
    mutationFn: followUpQueueApi.generate,
    onSettled: () => queryClient.invalidateQueries({ queryKey: followUpQueueKeys.all }),
  });
}
