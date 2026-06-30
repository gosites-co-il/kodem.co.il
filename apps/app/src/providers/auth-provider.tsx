'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { RoleName, User, Workspace } from '@kodem/contracts';
import { api, ApiError } from '../lib/api';
import { clearToken, getToken, setToken } from '../lib/auth/storage';
import { ROUTES } from '../lib/constants';

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  role: RoleName | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  setSession: (session: {
    user: User;
    workspace: Workspace;
    role: RoleName;
    token?: string;
  }) => void;
  refreshSession: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    workspace: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({
        user: null,
        workspace: null,
        role: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    try {
      const me = await api.me();
      setState({
        user: me.user,
        workspace: me.workspace,
        role: me.role,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearToken();
      }
      setState({
        user: null,
        workspace: null,
        role: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const setSession = useCallback(
    (session: {
      user: User;
      workspace: Workspace;
      role: RoleName;
      token?: string;
    }) => {
      if (session.token) {
        setToken(session.token);
      }
      setState({
        user: session.user,
        workspace: session.workspace,
        role: session.role,
        isLoading: false,
        isAuthenticated: true,
      });
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    setState({
      user: null,
      workspace: null,
      role: null,
      isLoading: false,
      isAuthenticated: false,
    });
    window.location.href = ROUTES.login;
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setSession,
      refreshSession,
      logout,
    }),
    [state, setSession, refreshSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
