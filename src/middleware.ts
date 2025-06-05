import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
]);

const isProtectedApiRoute = createRouteMatcher([
  '/api/campaigns(.*)',
  '/api/repositories(.*)',
  '/api/payments(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { hostname } = req.nextUrl;
  
  // Redirect www to non-www
  if (hostname.startsWith('www.')) {
    return NextResponse.redirect(
      `https://${hostname.replace('www.', '')}${req.nextUrl.pathname}${req.nextUrl.search}`,
      { status: 301 }
    );
  }

  // Handle Clerk authentication for protected routes and API routes
  if (isProtectedRoute(req) || isProtectedApiRoute(req)) {
    await auth.protect();
  }
  
  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: We need to include API routes for proper auth handling
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};