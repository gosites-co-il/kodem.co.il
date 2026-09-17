import { useEffect, useState } from 'react';
import { Button } from '@kodem/design-system/components/ui/button';
import { cn } from '@kodem/design-system/lib/utils';
import { PRIMARY_CTA_LABEL, SITE_CONFIG } from '../../lib/site-config';
import { scrollToCalculator } from '../../lib/scroll';

const NAV = [
  { href: '#pain', label: 'הבעיה' },
  { href: '#loss-calculator', label: 'מחשבון' },
  { href: '#pillars', label: 'המערכת' },
  { href: '#pricing', label: 'מחירים' },
  { href: '#faq', label: 'שאלות' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-200',
        scrolled
          ? 'border-b border-border/80 bg-background/90 shadow-sm backdrop-blur-md'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="text-lg font-bold tracking-tight text-foreground">
          {SITE_CONFIG.name}
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label="ניווט ראשי">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="hidden cursor-pointer bg-cta text-cta-foreground hover:bg-cta/90 sm:inline-flex"
            onClick={() => scrollToCalculator('header')}
          >
            {PRIMARY_CTA_LABEL}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            תפריט
          </Button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-background px-4 py-3 md:hidden"
        >
          <nav className="flex flex-col gap-3" aria-label="ניווט מובייל">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="cursor-pointer py-2 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Button
              type="button"
              className="mt-1 w-full cursor-pointer bg-cta text-cta-foreground hover:bg-cta/90"
              onClick={() => {
                setOpen(false);
                scrollToCalculator('header_mobile');
              }}
            >
              {PRIMARY_CTA_LABEL}
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
