'use client';

import Link from 'next/link';
import { cn } from '@kodem/design-system/lib/utils';

const LINKS = [
  { href: '/crm', label: 'סקירה', exact: true },
  { href: '/crm/boards', label: 'לוחות' },
  { href: '/crm/leads', label: 'לידים' },
  { href: '/crm/contacts', label: 'אנשי קשר' },
  { href: '/crm/tasks', label: 'משימות' },
] as const;

export function CrmNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-border pb-px"
      aria-label="ניווט CRM"
    >
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
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
