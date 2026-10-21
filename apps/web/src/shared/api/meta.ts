import { useQuery } from '@tanstack/react-query';
import { httpClient } from './http-client';
import type { ListResponse, Meta, Seller } from './types';

export const metaQueryKey = ['meta'] as const;
export const sellersQueryKey = ['sellers'] as const;

export function useMeta() {
  return useQuery({
    queryKey: metaQueryKey,
    queryFn: ({ signal }) => httpClient.get<Meta>('/meta', { signal }),
    staleTime: Infinity,
  });
}

export function useSellers() {
  return useQuery({
    queryKey: sellersQueryKey,
    queryFn: ({ signal }) => httpClient.get<ListResponse<Seller>>('/sellers', { signal }),
    select: (response) => response.data,
    staleTime: Infinity,
  });
}
