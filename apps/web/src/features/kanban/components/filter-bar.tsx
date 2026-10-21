'use client';

import { AlertTriangle, Search, X } from 'lucide-react';
import { useSellers } from '@/shared/api/meta';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { KanbanFiltersState } from '../hooks/use-kanban-filters';

const ALL_SELLERS = 'todos';

type FilterBarProps = { state: KanbanFiltersState };

export function FilterBar({ state }: FilterBarProps) {
  const { data: sellers = [] } = useSellers();
  const { filters, hasActiveFilters } = state;
  const sellerName = sellers.find((seller) => seller.id === filters.sellerId)?.name;

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={state.searchInput}
            onChange={(event) => state.setSearchInput(event.target.value)}
            placeholder="Buscar por código ou empresa"
            aria-label="Buscar por código ou empresa"
            maxLength={100}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.sellerId ?? ALL_SELLERS}
          onValueChange={(value) => state.setSellerId(value === ALL_SELLERS ? null : value)}
        >
          <SelectTrigger className="sm:w-48" aria-label="Vendedor">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SELLERS}>Todos os vendedores</SelectItem>
            {sellers.map((seller) => (
              <SelectItem key={seller.id} value={seller.id}>
                {seller.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          aria-pressed={Boolean(filters.needsAttention)}
          onClick={() => state.setNeedsAttention(!filters.needsAttention)}
          className={cn(
            filters.needsAttention && 'border-warning/30 bg-accent text-accent-foreground',
          )}
        >
          <AlertTriangle className={cn(filters.needsAttention && 'text-warning')} aria-hidden />
          Só precisa de atenção
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={state.clearFilters} className="sm:ml-auto">
            <X aria-hidden />
            Limpar filtros
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Filtros ativos:{' '}
          {[
            filters.search && `busca "${filters.search}"`,
            sellerName && `vendedor ${sellerName}`,
            filters.needsAttention && 'só precisa de atenção',
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
    </div>
  );
}
