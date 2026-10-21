import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { errorMessage } from '@/shared/api/api-error';
import { cn } from '@/shared/lib/cn';

type ErrorStateProps = {
  title: string;
  error?: unknown;
  onRetry: () => void;
  className?: string;
};

export function ErrorState({ title, error, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div>
          <p className="font-medium">{title}</p>
          {error !== undefined && <p className="text-xs">{errorMessage(error)}</p>}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
