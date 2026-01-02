import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /dashboard, /login)
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.includes(path);

  // If accessing a public path, allow the request
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected paths, check if there's a token
  // Note: We can't access localStorage in middleware, so we check for the token in cookies
  // The login page will store the token in both localStorage and a cookie
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow the request if token exists
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
