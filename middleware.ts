import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
import {
  PROTECTED_PREFIXES,
  getAllowedPrefixForUser,
  getDashboardPathForUser,
} from '@/lib/auth-routing';
import { canAccessPortalPath } from '@/lib/portal-routing';

const parsePermissionsCookie = (value: string) => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

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

  let permissions = null;
  const permissionsCookie = request.cookies.get('revure_permissions')?.value;
  if (permissionsCookie) {
    try {
      permissions = parsePermissionsCookie(permissionsCookie);
    } catch (e) {
      console.error('Failed to parse permissions cookie in middleware:', e);
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

      const dashboardPath = getDashboardPathForUser(user, permissions);
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

    if (canAccessPortalPath(pathname, permissions)) {
      return NextResponse.next();
    }

    // Role-based authorization
    const allowedPrefix = getAllowedPrefixForUser(user, permissions);
    const allowedPath = getDashboardPathForUser(user, permissions);

    // If user is accessing a dashboard they don't have access to
    if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(allowedPath, request.url));
    }

    // Special case for role 4 or unknown roles trying to access protected areas
    if (!allowedPrefix) {
      return NextResponse.redirect(new URL(allowedPath, request.url));
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
