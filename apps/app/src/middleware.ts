import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES, TOKEN_COOKIE } from './lib/constants';

const publicPaths = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.callback,
  ROUTES.verifyEmail,
  ROUTES.terms,
  ROUTES.privacy,
  '/invite',
];

const authRequiredPaths = [
  ROUTES.entry,
  ROUTES.workspaceSelect,
  ROUTES.workspaceSettings,
  ROUTES.setup,
  ROUTES.onboarding,
  ROUTES.dashboard,
  ROUTES.crm,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isPublic) {
    if (
      token &&
      (pathname === ROUTES.login ||
        pathname === ROUTES.loginEmail ||
        pathname.startsWith(`${ROUTES.login}/`) ||
        pathname === ROUTES.register)
    ) {
      return NextResponse.redirect(new URL(ROUTES.entry, request.url));
    }
    return NextResponse.next();
  }

  const isProtected = authRequiredPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isProtected && !token) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/entry',
    '/dashboard',
    '/dashboard/:path*',
    '/crm',
    '/crm/:path*',
    '/setup/:path*',
    '/onboarding/:path*',
    '/workspace/:path*',
    '/invite/:path*',
    '/login',
    '/login/:path*',
    '/register',
    '/auth/callback',
    '/auth/verify-email',
    '/terms',
    '/privacy',
  ],
};
