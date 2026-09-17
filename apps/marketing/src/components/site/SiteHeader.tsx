import { useEffect, useState } from 'react';
import { Button } from '@kodem/design-system/components/ui/button';
import { cn } from '@kodem/design-system/lib/utils';
import { PRIMARY_CTA_LABEL } from '../../lib/site-config';
import { PRIMARY_NAV } from '../../lib/nav';
import { Logo } from './Logo';

type Props = {
  currentPath?: string;
  /** When true, primary CTA scrolls to calculator on home; otherwise links to /#loss-calculator */
  homeCta?: boolean;
};

export function SiteHeader({ currentPath = '/', homeCta = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const ctaHref = homeCta ? '#loss-calculator' : '/#loss-calculator';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled || open
          ? 'border-b border-border/70 bg-background/80 shadow-sm backdrop-blur-xl'
          : 'bg-transparent',
      )}
    >
      <div className="container-site flex h-[4.25rem] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="ניווט ראשי">
          {PRIMARY_NAV.map((item) => {
            const active =
              currentPath === item.href ||
              (item.href !== '/' && currentPath.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'cursor-pointer rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/5 text-foreground'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="hidden h-10 cursor-pointer rounded-full bg-cta px-5 text-cta-foreground hover:bg-cta/90 sm:inline-flex"
          >
            <a href={ctaHref}>{PRIMARY_CTA_LABEL}</a>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-10 cursor-pointer rounded-full lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'סגור' : 'תפריט'}
          </Button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-background/95 px-4 py-5 backdrop-blur-xl lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="ניווט מובייל">
            {PRIMARY_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="cursor-pointer rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/contact"
              className="cursor-pointer rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              צור קשר
            </a>
            <Button
              asChild
              className="mt-3 h-12 w-full cursor-pointer rounded-full bg-cta text-cta-foreground hover:bg-cta/90"
            >
              <a href={ctaHref} onClick={() => setOpen(false)}>
                {PRIMARY_CTA_LABEL}
              </a>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
