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
  const { hostname, protocol } = req.nextUrl;
  
  // Force HTTPS in production
  if (hostname === 'monetizeg.dev' && protocol === 'http:') {
    return NextResponse.redirect(`https://monetizeg.dev${req.nextUrl.pathname}${req.nextUrl.search}`);
  }
  
  // Redirect www to non-www
  if (hostname === 'www.monetizeg.dev') {
    return NextResponse.redirect(`https://monetizeg.dev${req.nextUrl.pathname}${req.nextUrl.search}`);
  }

  // Handle Clerk authentication for protected routes and API routes
  if (isProtectedRoute(req) || isProtectedApiRoute(req)) {
    await auth.protect();
  }
  
  // Add security headers for production
  const response = NextResponse.next();
  if (hostname === 'monetizeg.dev') {
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }
  
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