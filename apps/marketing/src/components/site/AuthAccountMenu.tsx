import { Building2, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  AccountMenu,
  AccountMenuPanel,
  type AccountMenuAction,
} from '@kodem/design-system/components/ui/account-menu';
import { Skeleton } from '@kodem/design-system/components/ui/skeleton';
import { NAV_SIGNUP_HREF, NAV_SIGNUP_LABEL } from '../../lib/site-config';
import { useMarketingAuth } from '../../lib/marketing-auth';

function GuestActions({
  mobile,
  appRegisterUrl,
  onNavigate,
}: {
  mobile?: boolean;
  appRegisterUrl: string;
  onNavigate?: () => void;
}) {
  const href = appRegisterUrl || NAV_SIGNUP_HREF;

  if (mobile) {
    return (
      <div className="mt-3">
        <Button
          asChild
          className="h-12 w-full cursor-pointer rounded-full bg-cta text-cta-foreground hover:bg-cta/90"
        >
          <a href={href} onClick={onNavigate}>
            {NAV_SIGNUP_LABEL}
          </a>
        </Button>
      </div>
    );
  }

  return (
    <Button
      asChild
      size="sm"
      className="hidden h-10 cursor-pointer rounded-full bg-cta px-5 text-cta-foreground hover:bg-cta/90 sm:inline-flex"
    >
      <a href={href}>{NAV_SIGNUP_LABEL}</a>
    </Button>
  );
}

function buildItems(auth: ReturnType<typeof useMarketingAuth>, onNavigate?: () => void): AccountMenuAction[] {
  return [
    {
      id: 'dashboard',
      label: 'לדשבורד',
      href: auth.appDashboardUrl,
      icon: LayoutDashboard,
      onSelect: onNavigate,
    },
    {
      id: 'workspace-select',
      label: 'החלפת סביבה',
      href: auth.appWorkspaceSelectUrl,
      icon: UserRound,
      onSelect: onNavigate,
    },
    {
      id: 'workspace-settings',
      label: 'הגדרות סביבה',
      href: auth.appWorkspaceSettingsUrl,
      icon: Building2,
      onSelect: onNavigate,
    },
    {
      id: 'logout',
      label: 'יציאה',
      icon: LogOut,
      destructive: true,
      separatorBefore: true,
      onSelect: () => {
        onNavigate?.();
        auth.logout();
      },
    },
  ];
}

/** Single auth fetch shared by desktop + mobile chrome. */
export function useAuthAccountMenu() {
  return useMarketingAuth();
}

export function AuthAccountMenu(
  props: ReturnType<typeof useMarketingAuth> & {
    mobile?: boolean;
    onNavigate?: () => void;
  },
) {
  const { mobile, onNavigate, ...auth } = props;

  if (auth.isLoading) {
    return (
      <Skeleton
        className={
          mobile
            ? 'mt-3 h-12 w-full rounded-full'
            : 'hidden h-10 w-24 rounded-full sm:block'
        }
      />
    );
  }

  if (!auth.isAuthenticated || !auth.session) {
    return (
      <GuestActions
        mobile={mobile}
        onNavigate={onNavigate}
        appRegisterUrl={auth.appRegisterUrl}
      />
    );
  }

  const user = {
    name: auth.session.user.name,
    email: auth.session.user.email,
  };
  const subtitle = auth.session.workspace
    ? `${auth.session.workspace.name}${auth.session.role ? ` · ${auth.session.role}` : ''}`
    : null;
  const items = buildItems(auth, onNavigate);

  if (mobile) {
    return (
      <div className="mt-3 border-t border-border pt-3">
        <AccountMenuPanel user={user} subtitle={subtitle} items={items} />
      </div>
    );
  }

  return (
    <AccountMenu
      user={user}
      subtitle={subtitle}
      items={items}
      triggerClassName="hidden h-10 rounded-full sm:inline-flex"
    />
  );
}
