import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { cn } from '@kodem/design-system/lib/utils';
import { PRIMARY_NAV, isNavActive, isNavSectionActive, type NavItem } from '../../lib/nav';
import { Logo } from './Logo';
import { AuthAccountMenu, useAuthAccountMenu } from './AuthAccountMenu';

type Props = {
  currentPath?: string;
};

function DesktopNavItem({ item, currentPath }: { item: NavItem; currentPath: string }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const hasChildren = Boolean(item.children?.length);
  const active = isNavSectionActive(currentPath, item);

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => clearClose(), []);

  if (!hasChildren) {
    return (
      <a
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
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocusCapture={() => {
        clearClose();
        setOpen(true);
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          scheduleClose();
        }
      }}
    >
      <button
        type="button"
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
          active || open
            ? 'bg-primary/5 text-foreground'
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <ChevronDown
          className={cn('size-3.5 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 min-w-[13.5rem] rounded-2xl border border-border/80 bg-background/95 p-2 shadow-soft backdrop-blur-xl"
        >
          {item.children!.map((child) => {
            const childActive = isNavActive(currentPath, child.href);
            return (
              <a
                key={child.href}
                href={child.href}
                role="menuitem"
                className={cn(
                  'block cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  childActive
                    ? 'bg-primary/5 text-foreground'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
                aria-current={childActive ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {child.label}
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader({ currentPath = '/' }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileProductOpen, setMobileProductOpen] = useState(false);
  const auth = useAuthAccountMenu();

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

  useEffect(() => {
    if (isNavSectionActive(currentPath, PRIMARY_NAV[0]!)) {
      setMobileProductOpen(true);
    }
  }, [currentPath]);

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
          {PRIMARY_NAV.map((item) => (
            <DesktopNavItem key={item.href} item={item} currentPath={currentPath} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AuthAccountMenu {...auth} />
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
            {PRIMARY_NAV.map((item) => {
              if (!item.children?.length) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="cursor-pointer rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <div key={item.href} className="rounded-xl">
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                    aria-expanded={mobileProductOpen}
                    onClick={() => setMobileProductOpen((v) => !v)}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        'size-4 transition-transform',
                        mobileProductOpen && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </button>
                  {mobileProductOpen ? (
                    <div className="ms-2 mb-1 flex flex-col border-s border-border/70 ps-3">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <a
              href="/contact"
              className="cursor-pointer rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              צור קשר
            </a>
            <AuthAccountMenu {...auth} mobile onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      ) : null}
    </header>
  );
}
