'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@kodem/design-system/lib/utils';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';

const LINKS = [
  { href: ROUTES.adminWorkspaces, label: 'סביבות עבודה' },
  { href: ROUTES.adminUsers, label: 'משתמשים' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (user?.platformRole !== 'super_admin') {
    return (
      <div className="mx-auto max-w-lg space-y-2 py-12 text-center">
        <h1 className="text-xl font-semibold">אין הרשאה</h1>
        <p className="text-sm text-muted-foreground">
          אזור הניהול זמין לסופר־אדמין בלבד.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">ניהול</h1>
        <p className="text-sm text-muted-foreground">
          סביבות עבודה ומשתמשים בכל המערכת
        </p>
      </div>
      <div className="flex gap-1 border-b">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
