import Link from 'next/link';

const links = [
  { href: '/terms', label: 'תנאים' },
  { href: '/privacy', label: 'פרטיות' },
] as const;

export function AuthFooter() {
  return (
    <footer className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
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
