'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react';
import { cn } from '@kodem/design-system/lib/utils';
import { Button } from '@kodem/design-system/components/ui/button';
import { Badge } from '@kodem/design-system/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
} from '@kodem/design-system/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kodem/design-system/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@kodem/design-system/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@kodem/design-system/components/ui/sheet';
import { useIsMobile } from '@kodem/design-system/hooks/use-mobile';
import { useAuth } from '../../providers/auth-provider';
import { useTheme } from '../../providers/theme-provider';
import { ROUTES } from '../../lib/constants';
import {
  APP_NAV_SECTIONS,
  PRIMARY_NAV_LINK,
  type NavLinkItem,
  type NavSection,
} from './nav-config';

function MegaLinkCard({ item }: { item: NavLinkItem }) {
  const Icon = item.icon;

  return (
    <NavigationMenuLink asChild>
      <Link
        href={item.href}
        className="group flex gap-3 rounded-lg border bg-card p-3 text-start no-underline outline-none transition-colors hover:bg-accent focus:bg-accent"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium leading-none">{item.title}</p>
            {item.badge ? (
              <Badge variant="secondary" className="text-[10px] font-normal">
                {item.badge}
              </Badge>
            ) : null}
          </div>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {item.description}
          </p>
        </div>
      </Link>
    </NavigationMenuLink>
  );
}

function DesktopMegaPanel({ section }: { section: NavSection }) {
  return (
    <NavigationMenuContent>
      <div className="w-[min(100vw-2rem,36rem)] p-4 text-start">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {section.label}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {section.items.map((item) => (
            <MegaLinkCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </NavigationMenuContent>
  );
}

function MobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeSection, setActiveSection] = useState<NavSection | null>(null);
  const { user, workspace, logout } = useAuth();
  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'K';

  function closeMenu() {
    onOpenChange(false);
    setActiveSection(null);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-4 py-4 text-start">
          <SheetTitle className="text-base font-semibold">Kodem</SheetTitle>
          <p className="text-sm text-muted-foreground">{workspace?.name}</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {activeSection ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                <ChevronRight className="size-4" aria-hidden />
                חזרה
              </button>
              <p className="px-3 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {activeSection.label}
              </p>
              {activeSection.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-md px-3 py-3 text-start hover:bg-accent"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              <Link
                href={PRIMARY_NAV_LINK.href}
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-start hover:bg-accent"
              >
                <PRIMARY_NAV_LINK.icon className="size-4 shrink-0" />
                <span className="text-sm font-medium">{PRIMARY_NAV_LINK.label}</span>
              </Link>
              {APP_NAV_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-start hover:bg-accent"
                >
                  <span className="flex-1 text-sm font-medium">{section.label}</span>
                  <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto border-t p-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href={ROUTES.workspaceSelect} onClick={closeMenu}>
                החלפת סביבה
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive"
              onClick={() => {
                closeMenu();
                logout();
              }}
            >
              <LogOut className="size-4" />
              יציאה
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppNavbar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, workspace, role, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'K';

  const isDashboardActive = pathname === ROUTES.dashboard;

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
          {isMobile ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
                <span className="sr-only">תפריט</span>
              </Button>
              <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
            </>
          ) : null}

          <Link
            href={ROUTES.dashboard}
            className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
              K
            </span>
            <span className="hidden sm:inline">Kodem</span>
          </Link>

          {!isMobile ? (
            <NavigationMenu dir="rtl" className="hidden max-w-none md:flex">
              <NavigationMenuList className="justify-start gap-1">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href={PRIMARY_NAV_LINK.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        isDashboardActive && 'bg-accent text-accent-foreground',
                      )}
                    >
                      {PRIMARY_NAV_LINK.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {APP_NAV_SECTIONS.map((section) => (
                  <NavigationMenuItem key={section.id}>
                    <NavigationMenuTrigger>{section.label}</NavigationMenuTrigger>
                    <DesktopMegaPanel section={section} />
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isMobile ? (
            <Badge variant="outline" className="hidden font-normal lg:inline-flex">
              {workspace?.name}
            </Badge>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
            aria-label="החלפת ערכת נושא"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          {!isMobile ? (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 gap-2 px-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[8rem] truncate text-sm font-medium lg:inline">
                    {user?.name?.split(' ')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-start">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1 text-start">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {workspace?.name} · {role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.workspaceSelect} className="flex items-center gap-2">
                    <UserRound className="size-4" />
                    החלפת סביבה
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="size-4" />
                  יציאה
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
}
