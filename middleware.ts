import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

// Role to route prefix mapping
const ROLE_ROUTES: Record<number, string> = {
  1: '/admin',
  2: '/creator',
  3: '/affiliate',
  5: '/sales',
  6: '/production-manager',
};

// All protected route prefixes
const PROTECTED_PREFIXES = ['/admin', '/creator', '/affiliate', '/sales', '/production-manager'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
      const userTypeId = user.user_type_id || user.userTypeId;
      const dashboardPath = ROLE_ROUTES[userTypeId] || '/admin/dashboard';
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
    const userTypeId = user.user_type_id || user.userTypeId;
    const allowedPrefix = ROLE_ROUTES[userTypeId];

    // If user is accessing a dashboard they don't have access to
    if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
      // Redirect to their own dashboard
      const dashboardPath = `${allowedPrefix}/dashboard`;
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Special case for role 4 or unknown roles trying to access protected areas
    if (!allowedPrefix) {
      // If role is 4 (Sales Rep) and they don't have a prefix yet, maybe they belong to /sales
      if (userTypeId === 4) {
        return NextResponse.redirect(new URL('/sales/dashboard', request.url));
      }
      // Fallback for unknown authenticated users
      return NextResponse.redirect(new URL('/', request.url));
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
