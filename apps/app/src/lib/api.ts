import type {
  AdvanceSetupInput,
  AuthResult,
  BillingSnapshot,
  BusinessProfile,
  ChannelCatalogItem,
  ConfigureChannelInput,
  ConnectionActionResult,
  ConnectionCatalogItem,
  ConnectionPreviewResult,
  ConnectionSheetsListResult,
  Contact,
  CreateContactInput,
  CreateCrmBoardInput,
  CreateCrmBoardItemInput,
  CreateLeadInput,
  CreateTaskInput,
  CrmBoard,
  CrmBoardDetail,
  CrmBoardItem,
  CrmBoardPresetDefinition,
  EntryResolution,
  Insight,
  InvitePublicView,
  Lead,
  LeadStatus,
  Member,
  PlanDefinition,
  PlanId,
  Recommendation,
  RoleName,
  SetupStateResponse,
  Task,
  TaskStatus,
  UpdateContactInput,
  UpdateCrmBoardInput,
  UpdateCrmBoardItemInput,
  UpdateLeadInput,
  UpdateTaskInput,
  User,
  UserId,
  Workspace,
  WorkspaceChannel,
  WorkspaceInvite,
} from '@kodem/contracts';
import { API_URL } from './constants';
import { clearToken, getToken, setToken } from './auth/storage';
import type { CrmOverviewResponse } from './crm';

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
  emailVerified?: boolean;
}

export interface WorkspaceListItem {
  workspace: Workspace;
  role: RoleName;
  membership: Member;
}

export interface MemberListItem extends Member {
  email: string;
  name: string;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          clearToken();
          return null;
        }
        const body = (await res.json()) as AuthResult;
        const token = body.accessToken ?? body.token;
        if (token) setToken(token);
        return token ?? null;
      } catch {
        clearToken();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !retried && !path.startsWith('/auth/refresh')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, options, true);
    }
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    const message =
      body.message ??
      (res.status === 500
        ? 'השרת לא זמין. ודאו שה-API פועל (npm run dev:api).'
        : res.statusText);
    throw createApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

function persistAuthTokens(result: AuthResult): AuthResult {
  const token = result.accessToken ?? result.token;
  if (token) setToken(token);
  return result;
}

export const api = {
  register(body: { email: string; name: string; password: string }) {
    return request<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(persistAuthTokens);
  },

  login(body: { email: string; password: string }) {
    return request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(persistAuthTokens);
  },

  refresh() {
    return refreshAccessToken();
  },

  logout() {
    return request<{ ok: boolean }>('/auth/logout', { method: 'POST' }).finally(
      () => clearToken(),
    );
  },

  requestPasswordReset(email: string) {
    return request<{ ok: boolean }>('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  confirmPasswordReset(token: string, password: string) {
    return request<{ ok: boolean }>('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  verifyEmail(token: string) {
    return request<{ ok: boolean; emailVerified: boolean }>(
      '/auth/verify-email',
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      },
    );
  },

  resendVerifyEmail() {
    return request<{ ok: boolean }>('/auth/verify-email/resend', {
      method: 'POST',
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
    }).then(persistAuthTokens);
  },

  createWorkspace(body: { name?: string; websiteUrl?: string } = {}) {
    return request<AuthResult>('/workspace/create', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(persistAuthTokens);
  },

  listMembers() {
    return request<{ members: MemberListItem[]; invites: WorkspaceInvite[] }>(
      '/workspace/members',
    );
  },

  inviteMember(body: { email: string; role: RoleName }) {
    return request<{ invite: WorkspaceInvite }>('/workspace/members/invite', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  resendInvite(inviteId: string) {
    return request<{ invite: WorkspaceInvite }>(
      `/workspace/members/invites/${inviteId}/resend`,
      { method: 'POST' },
    );
  },

  changeMemberRole(userId: UserId | string, role: RoleName) {
    return request<{ member: Member }>(`/workspace/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  removeMember(userId: UserId | string) {
    return request<{ ok: boolean }>(`/workspace/members/${userId}`, {
      method: 'DELETE',
    });
  },

  leaveWorkspace() {
    return request<{ ok: boolean }>('/workspace/members/leave', {
      method: 'POST',
    });
  },

  deactivateWorkspace() {
    return request<{ ok: boolean }>('/workspace/members/deactivate', {
      method: 'POST',
    });
  },

  transferOwnership(toUserId: UserId | string) {
    return request<{ ok: boolean }>('/workspace/members/transfer', {
      method: 'POST',
      body: JSON.stringify({ toUserId }),
    });
  },

  getInvite(token: string) {
    return request<InvitePublicView>(`/invites/${encodeURIComponent(token)}`);
  },

  acceptInvite(token: string) {
    return request<{ member: Member }>(
      `/invites/${encodeURIComponent(token)}/accept`,
      { method: 'POST' },
    );
  },

  getBilling() {
    return request<BillingSnapshot>('/billing');
  },

  getBillingPlans() {
    return request<{ plans: PlanDefinition[] }>('/billing/plans');
  },

  upgradeIntent(planId: PlanId) {
    return request<{ configured: boolean; message: string; planId: PlanId }>(
      '/billing/upgrade-intent',
      {
        method: 'POST',
        body: JSON.stringify({ planId }),
      },
    );
  },

  resolveEntry(workspaceSelected?: boolean) {
    const query = workspaceSelected ? '?workspaceSelected=true' : '';
    return request<EntryResolution>(`/entry/resolve${query}`);
  },

  getSetup() {
    return request<SetupStateResponse>('/workspace/setup');
  },

  checkSetupSlug(slug: string) {
    const query = new URLSearchParams({ slug });
    return request<{
      slug: string;
      hostname: string;
      available: boolean;
      reason?: string;
      dnsChecked: boolean;
    }>(`/workspace/setup/slug-availability?${query.toString()}`);
  },

  suggestSetupIdentity() {
    return request<{
      source: 'corporate_email' | 'none';
      domain?: string;
      slug?: string;
      websiteUrl?: string;
      businessName?: string;
      discoveryStarted?: boolean;
    }>('/workspace/setup/identity-suggest');
  },

  saveSetupIdentity(body: {
    businessName: string;
    workspaceName: string;
    slug: string;
    websiteUrl?: string;
  }) {
    return request<SetupStateResponse>('/workspace/setup/identity', {
      method: 'POST',
      body: JSON.stringify(body),
    });
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

  startOverSetup() {
    return request<SetupStateResponse>('/workspace/setup/step', {
      method: 'POST',
      body: JSON.stringify({
        step: 'welcome',
        action: 'start_over',
      }),
    });
  },

  goBackSetup(step: string) {
    return request<SetupStateResponse>('/workspace/setup/step', {
      method: 'POST',
      body: JSON.stringify({
        step,
        action: 'go_back',
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

  getCrmOverview() {
    return request<CrmOverviewResponse>('/crm/overview');
  },

  listCrmLeads() {
    return request<{ leads: Lead[] }>('/crm/leads');
  },

  getCrmLead(id: string) {
    return request<{ lead: Lead }>(`/crm/leads/${id}`);
  },

  createCrmLead(body: CreateLeadInput) {
    return request<{ lead: Lead }>('/crm/leads', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateCrmLead(id: string, body: UpdateLeadInput) {
    return request<{ lead: Lead }>(`/crm/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  changeCrmLeadStatus(id: string, status: LeadStatus) {
    return request<{ lead: Lead }>(`/crm/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  convertCrmLead(
    id: string,
    body: { name?: string; email?: string; phone?: string; notes?: string } = {},
  ) {
    return request<{ lead: Lead; contactId: string }>(
      `/crm/leads/${id}/convert`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },

  deleteCrmLead(id: string) {
    return request<void>(`/crm/leads/${id}`, { method: 'DELETE' });
  },

  listCrmContacts() {
    return request<{ contacts: Contact[] }>('/crm/contacts');
  },

  getCrmContact(id: string) {
    return request<{ contact: Contact }>(`/crm/contacts/${id}`);
  },

  createCrmContact(body: CreateContactInput) {
    return request<{ contact: Contact }>('/crm/contacts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateCrmContact(id: string, body: UpdateContactInput) {
    return request<{ contact: Contact }>(`/crm/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  deleteCrmContact(id: string) {
    return request<void>(`/crm/contacts/${id}`, { method: 'DELETE' });
  },

  listCrmTasks(filters?: {
    leadId?: string;
    contactId?: string;
    status?: TaskStatus;
  }) {
    const params = new URLSearchParams();
    if (filters?.leadId) params.set('leadId', filters.leadId);
    if (filters?.contactId) params.set('contactId', filters.contactId);
    if (filters?.status) params.set('status', filters.status);
    const query = params.toString();
    return request<{ tasks: Task[] }>(
      `/crm/tasks${query ? `?${query}` : ''}`,
    );
  },

  getCrmTask(id: string) {
    return request<{ task: Task }>(`/crm/tasks/${id}`);
  },

  createCrmTask(body: CreateTaskInput) {
    return request<{ task: Task }>('/crm/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateCrmTask(id: string, body: UpdateTaskInput) {
    return request<{ task: Task }>(`/crm/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  completeCrmTask(id: string) {
    return request<{ task: Task }>(`/crm/tasks/${id}/complete`, {
      method: 'POST',
    });
  },

  deleteCrmTask(id: string) {
    return request<void>(`/crm/tasks/${id}`, { method: 'DELETE' });
  },

  listCrmPresets() {
    return request<{ presets: CrmBoardPresetDefinition[] }>('/crm/presets');
  },

  listCrmBoards() {
    return request<{ boards: CrmBoard[] }>('/crm/boards');
  },

  getCrmBoard(boardId: string) {
    return request<{ board: CrmBoardDetail }>(`/crm/boards/${boardId}`);
  },

  createCrmBoard(body: CreateCrmBoardInput) {
    return request<{ board: CrmBoardDetail }>('/crm/boards', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateCrmBoard(boardId: string, body: UpdateCrmBoardInput) {
    return request<{ board: CrmBoard }>(`/crm/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  deleteCrmBoard(boardId: string) {
    return request<void>(`/crm/boards/${boardId}`, { method: 'DELETE' });
  },

  createCrmBoardItem(boardId: string, body: CreateCrmBoardItemInput) {
    return request<{ item: CrmBoardItem }>(`/crm/boards/${boardId}/items`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateCrmBoardItem(
    boardId: string,
    itemId: string,
    body: UpdateCrmBoardItemInput,
  ) {
    return request<{ item: CrmBoardItem }>(
      `/crm/boards/${boardId}/items/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },

  deleteCrmBoardItem(boardId: string, itemId: string) {
    return request<void>(`/crm/boards/${boardId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  listConnectionsCatalog() {
    return request<{ catalog: ConnectionCatalogItem[] }>('/connections');
  },

  connectIntegration(integrationId: string) {
    return request<ConnectionActionResult>(
      `/connections/${integrationId}/connect`,
      { method: 'POST' },
    );
  },

  disconnectConnection(id: string) {
    return request<ConnectionActionResult>(`/connections/${id}`, {
      method: 'DELETE',
    });
  },

  bindConnectionResource(
    id: string,
    body: { spreadsheetUrl?: string; spreadsheetId?: string },
  ) {
    return request<ConnectionActionResult>(`/connections/${id}/resource`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  listConnectionSheets(id: string) {
    return request<ConnectionSheetsListResult | ConnectionActionResult>(
      `/connections/${id}/sheets`,
    );
  },

  previewConnectionSheet(
    id: string,
    params?: { sheet?: string; range?: string },
  ) {
    const q = new URLSearchParams();
    if (params?.sheet) q.set('sheet', params.sheet);
    if (params?.range) q.set('range', params.range);
    const qs = q.toString();
    return request<ConnectionPreviewResult | ConnectionActionResult>(
      `/connections/${id}/preview${qs ? `?${qs}` : ''}`,
    );
  },

  testConnection(id: string) {
    return request<ConnectionActionResult>(`/connections/${id}/test`, {
      method: 'POST',
    });
  },

  listChannelsCatalog() {
    return request<{ catalog: ChannelCatalogItem[] }>('/channels');
  },

  configureChannel(type: string, body: ConfigureChannelInput) {
    return request<{ channel: WorkspaceChannel }>(
      `/channels/${type}/configure`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  },

  disconnectChannel(type: string) {
    return request<{ ok: boolean }>(`/channels/${type}`, { method: 'DELETE' });
  },
};

export function getOAuthUrl(provider: 'google' | 'github' | 'facebook') {
  return `${API_URL}/auth/${provider}`;
}
