import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /dashboard, /login)
  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  // Define public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/plans', '/privacy', '/faq', '/verify-email'];
  const isPublicPath = publicPaths.includes(path);

  // SPECIAL CASE: Allow access to dashboard with subscription=success
  // This allows users returning from Stripe checkout to access the dashboard
  // even if their token expired during the checkout process
  if (path === '/dashboard' && searchParams.get('subscription') === 'success') {
    return NextResponse.next();
  }

  // SPECIAL CASE: Handle Supabase auth callbacks
  // Redirect expired email confirmation links to login page
  if (path === '/' && (searchParams.get('error') === 'access_denied' ||
    searchParams.get('error_code') === 'otp_expired')) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('message', 'email_verification_expired');
    return NextResponse.redirect(redirectUrl);
  }

  // SPECIAL CASE: Handle Supabase auth callback with code
  // When user clicks email confirmation link, Supabase redirects with ?code=...
  if (path === '/' && searchParams.get('code')) {
    // Create Supabase client to process the auth code
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Set cookies for the auth session
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
            });
          },
        },
      }
    );

    // Exchange the auth code for a session
    const code = searchParams.get('code');
    if (!code) {
      console.error('❌ No auth code provided');
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('message', 'email_verification_failed');
      return NextResponse.redirect(redirectUrl);
    }

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('❌ Error exchanging auth code:', error);
      // Handle specific error cases
      if (error.message.includes('flow_state_expired')) {
        console.error('❌ Flow state expired - email verification link expired');
        // Try to extract email from the code parameter to pre-fill the resend form
        const redirectUrl = new URL('/verify-email', request.url);
        redirectUrl.searchParams.set('message', 'flow_state_expired');
        // Note: We could try to extract email from the code, but for security, we'll let user enter it
        return NextResponse.redirect(redirectUrl);
      } else {
        // Other errors
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('message', 'email_verification_failed');
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (session) {
      console.log('✅ Email confirmation successful, session created');
      // Redirect to login page with success message
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('message', 'email_confirmed');
      return NextResponse.redirect(redirectUrl);
    }

    // If no session was created, redirect to login
    const fallbackRedirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(fallbackRedirectUrl);
  }

  // SPECIAL CASE: Handle successful email confirmation
  // When user clicks email confirmation link successfully
  if (path === '/' && searchParams.get('message') === 'confirmation_success') {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('message', 'email_confirmed');
    return NextResponse.redirect(redirectUrl);
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
    // Create Supabase client for middleware
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Não precisamos modificar cookies no middleware de leitura
          },
        },
      }
    )

    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Redirect to login if no session for protected paths
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Allow the request (either public path or protected path with valid session)
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
}