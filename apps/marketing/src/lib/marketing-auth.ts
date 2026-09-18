import { useCallback, useEffect, useState } from 'react';
import { SITE_CONFIG } from './site-config';

export type MarketingAuthUser = {
  name: string;
  email: string;
};

export type MarketingAuthWorkspace = {
  name: string;
};

export type MarketingAuthSession = {
  user: MarketingAuthUser;
  workspace: MarketingAuthWorkspace | null;
  role: string | null;
  accessToken: string;
};

type AuthState = {
  session: MarketingAuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

/** Prefer the app origin so host-only auth cookies from the SaaS app are sent. */
function appApiBase(): string {
  return `${SITE_CONFIG.appUrl.replace(/\/$/, '')}/api`;
}

async function refreshSession(): Promise<string | null> {
  try {
    const res = await fetch(`${appApiBase()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { accessToken?: string; token?: string };
    return body.accessToken ?? body.token ?? null;
  } catch {
    return null;
  }
}

async function fetchMe(accessToken: string): Promise<Omit<MarketingAuthSession, 'accessToken'> | null> {
  try {
    const res = await fetch(`${appApiBase()}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      user?: { name?: string; email?: string };
      workspace?: { name?: string } | null;
      role?: string | null;
    };
    if (!body.user?.email || !body.user?.name) return null;
    return {
      user: { name: body.user.name, email: body.user.email },
      workspace: body.workspace?.name ? { name: body.workspace.name } : null,
      role: body.role ?? null,
    };
  } catch {
    return null;
  }
}

export function useMarketingAuth(): AuthState & {
  logout: () => void;
  appLoginUrl: string;
  appRegisterUrl: string;
  appDashboardUrl: string;
  appWorkspaceSelectUrl: string;
  appWorkspaceSettingsUrl: string;
} {
  const [state, setState] = useState<AuthState>({
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const load = useCallback(async () => {
    const token = await refreshSession();
    if (!token) {
      setState({ session: null, isLoading: false, isAuthenticated: false });
      return;
    }
    const me = await fetchMe(token);
    if (!me) {
      setState({ session: null, isLoading: false, isAuthenticated: false });
      return;
    }
    setState({
      session: { ...me, accessToken: token },
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = useCallback(() => {
    const token = state.session?.accessToken;
    void fetch(`${appApiBase()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
    }).finally(() => {
      setState({ session: null, isLoading: false, isAuthenticated: false });
    });
  }, [state.session?.accessToken]);

  const app = SITE_CONFIG.appUrl.replace(/\/$/, '');

  return {
    ...state,
    logout,
    appLoginUrl: `${app}/login`,
    appRegisterUrl: SITE_CONFIG.appSignupBase,
    appDashboardUrl: `${app}/dashboard`,
    appWorkspaceSelectUrl: `${app}/workspace/select`,
    appWorkspaceSettingsUrl: `${app}/workspace/settings`,
  };
}
