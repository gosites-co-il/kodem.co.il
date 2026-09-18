'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@kodem/design-system/lib/utils';
import { ROUTES } from '../../lib/constants';

const LINKS = [
  { href: ROUTES.workspaceIntegrationsConnections, label: 'חיבורים' },
  { href: ROUTES.workspaceIntegrationsChannels, label: 'ערוצים' },
] as const;

export function IntegrationsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-border pb-px"
      aria-label="ניווט חיבורים"
    >
      {LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px rounded-t-md border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              active
                ? 'border-primary font-semibold text-foreground'
                : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
