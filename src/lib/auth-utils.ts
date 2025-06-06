import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { enhancedRateLimit, getClientIdentifier, SecurityMonitor, SecurityEventType } from './security-monitor';

// Helper function to extract IP address from request
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Reusable authentication utility for API routes
 * Throws an error if user is not authenticated
 */
export async function requireAuth(request?: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      if (request) {
              SecurityMonitor.logEvent({
        type: SecurityEventType.AUTHENTICATION_FAILURE,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: request.url,
        details: { reason: 'No user ID in auth context' },
        severity: 'medium',
      });
      }
      throw new AuthenticationError('Authentication required');
    }
    
    return userId;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    if (request) {
      SecurityMonitor.logEvent({
        type: SecurityEventType.AUTHENTICATION_FAILURE,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: request.url,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high',
      });
    }
    
    throw new AuthenticationError('Authentication service unavailable');
  }
}

/**
 * Returns authentication info without throwing
 * Useful for optional authentication scenarios
 */
export async function getAuthInfo() {
  try {
    const { userId, sessionId } = await auth();
    return { userId, sessionId, isAuthenticated: !!userId };
  } catch (error) {
    console.error('Auth info retrieval failed:', error);
    return { userId: null, sessionId: null, isAuthenticated: false };
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth<T extends unknown[]>(
  handler: (userId: string, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const request = args.find(arg => arg && typeof arg === 'object' && 'url' in arg) as NextRequest;
      const userId = await requireAuth(request);
      return await handler(userId, ...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      console.error('API route error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Validates that the authenticated user matches the requested user ID
 */
export function validateUserAccess(authenticatedUserId: string, requestedUserId: string, request?: NextRequest) {
  if (authenticatedUserId !== requestedUserId) {
    if (request) {
      SecurityMonitor.logEvent({
        type: SecurityEventType.AUTHORIZATION_FAILURE,
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        userId: authenticatedUserId,
        endpoint: request.url,
        details: { 
          authenticatedUserId, 
          requestedUserId,
          reason: 'User ID mismatch'
        },
        severity: 'high',
      });
    }
    throw new AuthorizationError('Access denied: User ID mismatch');
  }
}

/**
 * Custom error classes for better error handling
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Enhanced rate limiting with security monitoring
 */
export function checkRateLimit(
  configKey: 'auth' | 'api-general' | 'user-creation' | 'repo-creation' | 'github-api',
  request: NextRequest,
  userId?: string
): boolean {
  const identifier = getClientIdentifier(request, userId);
  const result = enhancedRateLimit(identifier, configKey, request);
  
  return result.allowed;
}

/**
 * Security headers utility
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

/**
 * Validate request input and log suspicious activity
 */
export function validateInput(
  input: Record<string, unknown>,
  rules: Record<string, (value: unknown) => boolean>,
  request?: NextRequest
): boolean {
  for (const [field, validator] of Object.entries(rules)) {
    if (!validator(input[field])) {
      if (request) {
        SecurityMonitor.logEvent({
          type: SecurityEventType.INVALID_INPUT,
          ip: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          endpoint: request.url,
          details: { 
            field,
            value: typeof input[field] === 'string' ? input[field].substring(0, 100) : typeof input[field],
            reason: 'Validation failed'
          },
          severity: 'low',
        });
      }
      return false;
    }
  }
  return true;
}

/**
 * Check for suspicious request patterns
 */
export function detectSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  
  // Check for common bot patterns
  const suspiciousUserAgents = [
    'curl', 'wget', 'python-requests', 'bot', 'crawler', 'spider',
    'scraper', 'postman', 'insomnia'
  ];
  
  const isSuspiciousUserAgent = suspiciousUserAgents.some(pattern => 
    userAgent.toLowerCase().includes(pattern)
  );
  
  // Check for missing or suspicious headers
  const hasValidHeaders = userAgent && (origin || referer);
  
  if (isSuspiciousUserAgent || !hasValidHeaders) {
    SecurityMonitor.logEvent({
      type: SecurityEventType.SUSPICIOUS_REQUEST,
      ip: request.ip || 'unknown',
      userAgent,
      endpoint: request.url,
      details: { 
        reason: isSuspiciousUserAgent ? 'Suspicious user agent' : 'Missing headers',
        origin,
        referer
      },
      severity: 'low',
    });
    
    return true;
  }
  
  return false;
}

