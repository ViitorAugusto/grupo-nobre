'use client';

import { useEffect, useState } from 'react';
import type { OpportunityFilters } from '@/shared/api/types';
import { useSearchParamState } from '@/shared/hooks/use-search-param-state';

const PARAMS = { search: 'busca', sellerId: 'vendedor', needsAttention: 'atencao' } as const;
const SEARCH_DEBOUNCE_MS = 300;

export function useKanbanFilters() {
  const { searchParams, setParams } = useSearchParamState();

  const filters: OpportunityFilters = {
    search: searchParams.get(PARAMS.search) ?? undefined,
    sellerId: searchParams.get(PARAMS.sellerId) ?? undefined,
    needsAttention: searchParams.get(PARAMS.needsAttention) === '1' || undefined,
  };

  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  useEffect(() => {
    const value = searchInput.trim();
    if (value === (filters.search ?? '')) return;
    const timer = setTimeout(
      () => setParams({ [PARAMS.search]: value.slice(0, 100) }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setParams]);

  const hasActiveFilters = Boolean(filters.search || filters.sellerId || filters.needsAttention);

  return {
    filters,
    hasActiveFilters,
    searchInput,
    setSearchInput,
    setSellerId: (sellerId: string | null) => setParams({ [PARAMS.sellerId]: sellerId }),
    setNeedsAttention: (on: boolean) => setParams({ [PARAMS.needsAttention]: on ? '1' : null }),
    clearFilters: () => {
      setSearchInput('');
      setParams({ [PARAMS.search]: null, [PARAMS.sellerId]: null, [PARAMS.needsAttention]: null });
    },
  };
}

export type KanbanFiltersState = ReturnType<typeof useKanbanFilters>;
