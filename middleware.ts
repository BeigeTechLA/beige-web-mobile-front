import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
import {
  PROTECTED_PREFIXES,
  getAllowedPrefixForUser,
  getDashboardPathForUser,
} from '@/lib/auth-routing';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const searchParams = request.nextUrl.searchParams;
  const isForcedLoginFlow = searchParams.get('adminOnly') === '1' || searchParams.get('reason') === 'role_mismatch';

  // 1. Get user data from cookies
  const userCookie = request.cookies.get('revure_user')?.value;
  const token = request.cookies.get('revure_token')?.value;

  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch (e) {
      console.error('Failed to parse user cookie in middleware:', e);
    }
  }

  const isAuthenticated = !!(user && token);

  // 2. Handle Authentication Pages (Login/Signup)
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname === '/creator-signup') {
    if (isAuthenticated) {
      // If already logged in, redirect to their dashboard
      // Allow logged-in users to access login when explicitly forced (role mismatch/admin only)
      if (isForcedLoginFlow) {
        return NextResponse.next();
      }

      const dashboardPath = getDashboardPathForUser(user);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    return NextResponse.next();
  }

  // 3. Handle Protected Routes
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based authorization
    const allowedPrefix = getAllowedPrefixForUser(user);

    // If user is accessing a dashboard they don't have access to
    if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
      const loginUrl = new URL('/login', request.url);
      if (pathname.startsWith('/admin') && allowedPrefix !== '/admin') {
        loginUrl.searchParams.set('adminOnly', '1');
        loginUrl.searchParams.set('reason', 'admin_only');
      } else {
        loginUrl.searchParams.set('reason', 'role_mismatch');
      }
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Special case for role 4 or unknown roles trying to access protected areas
    if (!allowedPrefix) {
      // Fallback for unknown authenticated users
      return NextResponse.redirect(new URL(getDashboardPathForUser(user), request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - videos (public videos)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|videos).*)',
  ],
};
