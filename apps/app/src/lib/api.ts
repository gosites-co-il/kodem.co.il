import type {
  AdvanceSetupInput,
  AuthResult,
  BusinessProfile,
  EntryResolution,
  Insight,
  Member,
  Recommendation,
  RoleName,
  SetupStateResponse,
  User,
  Workspace,
} from '@kodem/contracts';
import { API_URL } from './constants';
import { getToken } from './auth/storage';

export type ApiError = Error & { status: number; name: 'ApiError' };

export function createApiError(status: number, message: string): ApiError {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.status = status;
  return error;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    error.name === 'ApiError' &&
    typeof (error as ApiError).status === 'number'
  );
}

export interface MeResponse {
  user: User;
  workspace: Workspace;
  role: RoleName;
  membership: Member;
}

export interface WorkspaceListItem {
  workspace: Workspace;
  role: RoleName;
  membership: Member;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    const message =
      body.message ??
      (res.status === 500
        ? 'השרת לא זמין. ודאו שה-API פועל (npm run dev:api).'
        : res.statusText);
    throw createApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  register(body: { email: string; name: string; password: string }) {
    return request<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  login(body: { email: string; password: string }) {
    return request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  me() {
    return request<MeResponse>('/auth/me');
  },

  listWorkspaces() {
    return request<{ workspaces: WorkspaceListItem[] }>('/workspace/list');
  },

  switchWorkspace(workspaceId: string) {
    return request<AuthResult>('/workspace/switch', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    });
  },

  resolveEntry(workspaceSelected?: boolean) {
    const query = workspaceSelected ? '?workspaceSelected=true' : '';
    return request<EntryResolution>(`/entry/resolve${query}`);
  },

  getSetup() {
    return request<SetupStateResponse>('/workspace/setup');
  },

  advanceSetupStep(body: AdvanceSetupInput) {
    return request<SetupStateResponse>('/workspace/setup/step', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  discoverWebsite(websiteUrl: string) {
    return request<SetupStateResponse>('/workspace/setup/discover', {
      method: 'POST',
      body: JSON.stringify({ websiteUrl }),
    });
  },

  restartDiscovery() {
    return request<SetupStateResponse>('/workspace/setup/step', {
      method: 'POST',
      body: JSON.stringify({
        step: 'business_discovery',
        action: 'restart_discovery',
      }),
    });
  },

  runSetupPreparation() {
    return request<SetupStateResponse>('/workspace/setup/prepare', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  completeSetup() {
    return request<SetupStateResponse>('/workspace/setup/complete', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  getWorkspaceOverview() {
    return request<{
      workspace: Workspace;
      profile: BusinessProfile | null;
      insights: Insight[];
      recommendations: Recommendation[];
      primaryRecommendation: Recommendation | undefined;
      discoveryProgress: {
        website: boolean;
        profile: boolean;
        insights: boolean;
        recommendations: boolean;
      };
    }>('/workspace/overview');
  },
};

export function getOAuthUrl(provider: 'google' | 'github' | 'facebook') {
  return `${API_URL}/auth/${provider}`;
}
