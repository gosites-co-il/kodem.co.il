'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@kodem/design-system/lib/utils';
import { ROUTES } from '../../lib/constants';

const LINKS = [
  { href: ROUTES.workspaceSettings, label: 'חשבון', exact: true },
  { href: ROUTES.workspaceSettingsProfile, label: 'פרופיל' },
  { href: ROUTES.workspaceSettingsTeam, label: 'צוות' },
  { href: ROUTES.workspaceSettingsNotifications, label: 'התראות' },
  { href: ROUTES.workspaceSettingsEmailLog, label: 'יומן מיילים' },
  { href: ROUTES.workspaceSettingsMessages, label: 'הודעות מוכנות' },
  { href: ROUTES.workspaceSettingsCrm, label: 'CRM' },
  { href: ROUTES.workspaceSettingsTags, label: 'תגיות' },
  { href: ROUTES.workspaceSettingsApiKeys, label: 'מפתחות API' },
  { href: ROUTES.workspaceSettingsFiles, label: 'קבצים' },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-row flex-wrap gap-1 lg:w-52 lg:shrink-0 lg:flex-col"
      aria-label="ניווט הגדרות"
    >
      {LINKS.map((link) => {
        const exact = 'exact' in link && link.exact;
        const active = exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              active
                ? 'bg-muted font-semibold text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
