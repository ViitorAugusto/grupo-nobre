'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/cn';
import { ReferenceDateBanner } from './reference-date-banner';
import { ThemeToggle } from './theme-toggle';

const NAV = [
  { href: '/', label: 'Oportunidades' },
  { href: '/retornos', label: 'Retornos de hoje' },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b bg-card">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <p className="flex items-center gap-2 font-heading text-lg font-bold">
          <span className="h-5 w-1.5 rounded-full bg-sprout" aria-hidden />
          Nobre Brindes{' '}
          <span className="font-sans text-sm font-normal text-muted-foreground">CRM</span>
        </p>
        <nav aria-label="Principal" className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                'aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ReferenceDateBanner />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
