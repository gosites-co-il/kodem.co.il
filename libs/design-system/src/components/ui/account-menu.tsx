'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { Avatar, AvatarFallback } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { cn } from '../../lib/utils';

export type AccountMenuUser = {
  name: string;
  email: string;
};

export type AccountMenuAction = {
  id: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  icon?: LucideIcon;
  destructive?: boolean;
  /** Draw a separator above this item */
  separatorBefore?: boolean;
};

export type AccountMenuLinkProps = {
  href: string;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

type LinkComponent = React.ComponentType<AccountMenuLinkProps>;

export function getUserInitials(name: string, fallback = '?'): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return initials || fallback;
}

function DefaultLink({ href, className, onClick, children }: AccountMenuLinkProps) {
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}

export type AccountMenuProps = {
  user: AccountMenuUser;
  /** Secondary line under email, e.g. "Workspace · admin" */
  subtitle?: string | null;
  items: AccountMenuAction[];
  dir?: 'rtl' | 'ltr';
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  /** Show first name next to the avatar on large screens */
  showNameOnTrigger?: boolean;
  linkComponent?: LinkComponent;
};

export function AccountMenu({
  user,
  subtitle,
  items,
  dir = 'rtl',
  className,
  triggerClassName,
  contentClassName,
  showNameOnTrigger = true,
  linkComponent: Link = DefaultLink,
}: AccountMenuProps) {
  const initials = getUserInitials(user.name);
  const firstName = user.name.split(/\s+/).filter(Boolean)[0] ?? user.name;

  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn('relative h-9 gap-2 px-2', triggerClassName, className)}
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          {showNameOnTrigger ? (
            <span className="hidden max-w-[8rem] truncate text-sm font-medium lg:inline">
              {firstName}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn('w-56 text-start', contentClassName)}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1 text-start">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => {
          const Icon = item.icon;
          const itemClass = cn(
            'flex cursor-pointer items-center gap-2',
            item.destructive && 'text-destructive focus:text-destructive',
          );

          return (
            <React.Fragment key={item.id}>
              {item.separatorBefore ? <DropdownMenuSeparator /> : null}
              {item.href ? (
                <DropdownMenuItem asChild className={itemClass}>
                  <Link href={item.href} className={itemClass} onClick={item.onSelect}>
                    {Icon ? <Icon className="size-4" aria-hidden /> : null}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className={itemClass}
                  onClick={item.onSelect}
                >
                  {Icon ? <Icon className="size-4" aria-hidden /> : null}
                  {item.label}
                </DropdownMenuItem>
              )}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type AccountMenuPanelProps = {
  user: AccountMenuUser;
  subtitle?: string | null;
  items: AccountMenuAction[];
  className?: string;
  linkComponent?: LinkComponent;
};

/** Stacked identity + actions for mobile drawers / sheets. */
export function AccountMenuPanel({
  user,
  subtitle,
  items,
  className,
  linkComponent: Link = DefaultLink,
}: AccountMenuPanelProps) {
  const initials = getUserInitials(user.name);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 text-start">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const className = cn(
            'flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent',
            item.destructive && 'text-destructive hover:text-destructive',
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={className}
                onClick={item.onSelect}
              >
                {Icon ? <Icon className="size-4" aria-hidden /> : null}
                {item.label}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              className={className}
              onClick={item.onSelect}
            >
              {Icon ? <Icon className="size-4" aria-hidden /> : null}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
