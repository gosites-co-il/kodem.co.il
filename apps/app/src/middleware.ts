import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES, TOKEN_COOKIE } from './lib/constants';

const publicPaths = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.callback,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isPublic) {
    if (token && (pathname === ROUTES.login || pathname === ROUTES.register)) {
      return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
    }
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/workspace');

  if (isProtected && !token) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/workspace/:path*',
    '/login',
    '/register',
    '/auth/callback',
  ],
};
