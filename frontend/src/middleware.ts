import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /dashboard, /login)
  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  // Define public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/plans', '/privacy', '/faq'];
  const isPublicPath = publicPaths.includes(path);

  // SPECIAL CASE: Allow access to dashboard with subscription=success
  // This allows users returning from Stripe checkout to access the dashboard
  // even if their token expired during the checkout process
  if (path === '/dashboard' && searchParams.get('subscription') === 'success') {
    return NextResponse.next();
  }

  // If accessing a public path, allow the request
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Define protected paths that require authentication
  const protectedPaths = [
    '/dashboard',
    '/clients',
    '/productions',
    '/services',
    '/users',
    '/settings',
    '/calendar',
    '/reports'
  ];

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(protectedPath =>
    path === protectedPath || path.startsWith(protectedPath + '/')
  );

  // Only check authentication for protected paths
  if (isProtectedPath) {
    // Note: We can't access localStorage in middleware, so we check for the token in cookies
    // The login page will store the token in both localStorage and a cookie
    const token = request.cookies.get('token')?.value;

    if (!token) {
      // Redirect to login if no token for protected paths
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Allow the request (either public path or protected path with valid token)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};
