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
    '/dashboard/:path*',
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
