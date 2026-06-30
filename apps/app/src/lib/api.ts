import type {
  AuthResult,
  Member,
  RoleName,
  User,
  Workspace,
} from '@kodem/contracts';
import { API_URL } from './constants';
import { getToken } from './auth/storage';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
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
    throw new ApiError(res.status, body.message ?? res.statusText);
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
};

export function getOAuthUrl(provider: 'google' | 'github' | 'facebook') {
  return `${API_URL}/auth/${provider}`;
}
