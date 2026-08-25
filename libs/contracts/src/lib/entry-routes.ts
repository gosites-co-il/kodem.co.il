/** Canonical entry-flow routes — single source of truth for navigation targets. */
export const ENTRY_ROUTES = {
  login: '/login',
  loginEmail: '/login/email',
  register: '/register',
  callback: '/auth/callback',
  entry: '/entry',
  workspaceSelect: '/workspace/select',
  /** Legacy path — app redirects to {@link ENTRY_ROUTES.setup}. */
  onboarding: '/onboarding',
  setup: '/setup',
  dashboard: '/dashboard',
  terms: '/terms',
  privacy: '/privacy',
} as const;

export type EntryRoute = (typeof ENTRY_ROUTES)[keyof typeof ENTRY_ROUTES];
