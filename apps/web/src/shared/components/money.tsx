import { formatMoney } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

type MoneyProps = { value: number | null; className?: string };

export function Money({ value, className }: MoneyProps) {
  return (
    <span className={cn('font-data tabular-nums', className)}>
      {value === null ? 'Sem valor' : formatMoney(value)}
    </span>
  );
}
