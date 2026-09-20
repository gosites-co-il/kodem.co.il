/** Canonical entry-flow routes — single source of truth for navigation targets. */
export const ENTRY_ROUTES = {
  login: '/login',
  loginEmail: '/login/email',
  loginReset: '/login/reset',
  register: '/register',
  callback: '/auth/callback',
  verifyEmail: '/auth/verify-email',
  entry: '/entry',
  workspaceSelect: '/workspace/select',
  workspaceSettings: '/workspace/settings',
  /** @deprecated Prefer {@link ENTRY_ROUTES.workspaceIntegrationsConnections}. */
  workspaceSettingsConnections: '/workspace/integrations/connections',
  /** @deprecated Prefer {@link ENTRY_ROUTES.workspaceIntegrationsChannels}. */
  workspaceSettingsChannels: '/workspace/integrations/channels',
  workspaceIntegrations: '/workspace/integrations',
  workspaceIntegrationsConnections: '/workspace/integrations/connections',
  workspaceIntegrationsChannels: '/workspace/integrations/channels',
  /** Legacy path — app redirects to {@link ENTRY_ROUTES.setup}. */
  onboarding: '/onboarding',
  setup: '/setup',
  dashboard: '/dashboard',
  crm: '/crm',
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
  aiTerms: '/ai-terms',
} as const;

export type EntryRoute = (typeof ENTRY_ROUTES)[keyof typeof ENTRY_ROUTES];
