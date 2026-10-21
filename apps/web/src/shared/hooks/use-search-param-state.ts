'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useSearchParamState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { searchParams, setParams };
}

const DETAIL_PARAM = 'oportunidade';

export function useOpportunityDetailParam() {
  const { searchParams, setParams } = useSearchParamState();
  return {
    openId: searchParams.get(DETAIL_PARAM),
    open: (id: string) => setParams({ [DETAIL_PARAM]: id }),
    close: () => setParams({ [DETAIL_PARAM]: null }),
  };
}
