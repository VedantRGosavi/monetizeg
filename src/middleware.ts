import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/auth(.*)',
  '/api/stripe/webhook(.*)', // Stripe webhooks must be public
  '/api/intelligent-ads/public(.*)', // Any explicitly public API endpoints
]);

// API routes that should be protected (default all API routes)
const isApiRoute = createRouteMatcher([
  '/api/(.*)',
]);

// Dashboard and settings routes that should be protected
const isDashboardRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Check if the route should be protected
  if ((isApiRoute(req) && !isPublicRoute(req)) || isDashboardRoute(req)) {
    // Use the correct pattern for auth.protect()
    const protectResponse = await auth.protect();
    if (protectResponse) {
      // If auth.protect() returns a response (redirect to sign-in), return it
      return protectResponse;
    }
  }
  
  // If we get here, either the route is public or auth passed
  const response = NextResponse.next();
  
  // Add comprehensive security headers
  // 1. Basic security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 2. Remove deprecated header
  // response.headers.set('X-XSS-Protection', '1; mode=block'); // Deprecated - removed
  
  // 3. Add modern security headers
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  
  // 4. Add Content-Security-Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://*.clerk.accounts.dev https://cdn.jsdelivr.net https://js.stripe.com 'unsafe-inline'; " +
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' https://*.clerk.accounts.dev https://img.clerk.com data: blob:; " +
    "connect-src 'self' https://*.clerk.accounts.dev https://api.stripe.com; " +
    "frame-src 'self' https://js.stripe.com https://*.clerk.accounts.dev; " +
    "object-src 'none';"
  );
  
  // 5. Add CORS headers for API routes
  if (isApiRoute(req)) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
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
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
