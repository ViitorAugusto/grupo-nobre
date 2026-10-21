import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { ApiError } from './api-error';
import { httpClient } from './http-client';
import type {
  ListResponse,
  Opportunity,
  OpportunityDetail,
  OpportunityFilters,
  StageChangeInput,
} from './types';

export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (filters: OpportunityFilters) => [...opportunityKeys.lists(), filters] as const,
  detail: (id: string) => [...opportunityKeys.all, 'detail', id] as const,
};

const followUpQueueKey = ['follow-up-queue'] as const;

export const moveStageMutationKey = ['opportunities', 'move-stage'] as const;

export const opportunitiesApi = {
  list: (filters: OpportunityFilters, signal?: AbortSignal) =>
    httpClient.get<ListResponse<Opportunity>>('/opportunities', {
      signal,
      query: {
        search: filters.search,
        sellerId: filters.sellerId,
        needsAttention: filters.needsAttention ? true : undefined,
      },
    }),
  detail: (id: string, signal?: AbortSignal) =>
    httpClient.get<OpportunityDetail>(`/opportunities/${id}`, { signal }),
  moveStage: (id: string, input: StageChangeInput) =>
    httpClient.post<OpportunityDetail>(`/opportunities/${id}/stage-changes`, input),
  registerContact: (id: string) =>
    httpClient.post<OpportunityDetail>(`/opportunities/${id}/contacts`),
};

export function useOpportunities(filters: OpportunityFilters) {
  return useQuery({
    queryKey: opportunityKeys.list(filters),
    queryFn: ({ signal }) => opportunitiesApi.list(filters, signal),
    select: (response) => response.data,
    placeholderData: (previous) => previous,
  });
}

export function useOpportunityDetail(id: string | null) {
  return useQuery({
    queryKey: opportunityKeys.detail(id ?? ''),
    queryFn: ({ signal }) => opportunitiesApi.detail(id as string, signal),
    enabled: id !== null,
  });
}

type ListSnapshot = [readonly unknown[], ListResponse<Opportunity> | undefined][];

function updateInLists(
  queryClient: QueryClient,
  id: string,
  update: (opportunity: Opportunity) => Opportunity,
) {
  queryClient.setQueriesData<ListResponse<Opportunity>>(
    { queryKey: opportunityKeys.lists() },
    (current) =>
      current && {
        data: current.data.map((opportunity) =>
          opportunity.id === id ? update(opportunity) : opportunity,
        ),
      },
  );
}

function toSummary(detail: OpportunityDetail): Opportunity {
  const summary: Partial<OpportunityDetail> = { ...detail };
  delete summary.history;
  return summary as Opportunity;
}

function storeDetail(queryClient: QueryClient, detail: OpportunityDetail) {
  queryClient.setQueryData(opportunityKeys.detail(detail.id), detail);
  updateInLists(queryClient, detail.id, () => toSummary(detail));
}

function invalidateAfterWrite(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: opportunityKeys.all }),
    queryClient.invalidateQueries({ queryKey: followUpQueueKey }),
  ]);
}

export type MoveStageVariables = { opportunity: Opportunity; input: StageChangeInput };

export function useMoveStage() {
  const queryClient = useQueryClient();
  return useMutation<OpportunityDetail, ApiError, MoveStageVariables, { snapshot: ListSnapshot }>({
    mutationKey: moveStageMutationKey,
    mutationFn: ({ opportunity, input }) => opportunitiesApi.moveStage(opportunity.id, input),
    onMutate: async ({ opportunity, input }) => {
      await queryClient.cancelQueries({ queryKey: opportunityKeys.lists() });
      const snapshot = queryClient.getQueriesData<ListResponse<Opportunity>>({
        queryKey: opportunityKeys.lists(),
      });
      updateInLists(queryClient, opportunity.id, (current) => ({
        ...current,
        stage: input.toStage,
      }));
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: (detail) => storeDetail(queryClient, detail),
    onSettled: () => invalidateAfterWrite(queryClient),
  });
}

export function useRegisterContact() {
  const queryClient = useQueryClient();
  return useMutation<OpportunityDetail, ApiError, { id: string }>({
    mutationFn: ({ id }) => opportunitiesApi.registerContact(id),
    onSuccess: (detail) => storeDetail(queryClient, detail),
    onSettled: () => invalidateAfterWrite(queryClient),
  });
}
