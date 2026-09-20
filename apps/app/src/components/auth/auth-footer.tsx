import Link from 'next/link';
import { ROUTES } from '../../lib/constants';

const links = [
  { href: ROUTES.terms, label: 'תקנון שימוש' },
  { href: ROUTES.privacy, label: 'מדיניות פרטיות' },
  { href: ROUTES.cookies, label: 'Cookies' },
  { href: ROUTES.aiTerms, label: 'תנאי AI' },
] as const;

export function AuthFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
      {links.map((link, index) => (
        <span key={link.href} className="flex items-center gap-3">
          {index > 0 ? (
            <span aria-hidden className="text-border">
              ·
            </span>
          ) : null}
          <Link
            href={link.href}
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {link.label}
          </Link>
        </span>
      ))}
    </footer>
  );
}
