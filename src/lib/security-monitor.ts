import { NextRequest } from 'next/server';

// Enhanced rate limiting with different tiers
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked?: boolean;
  blockUntil?: number;
  violations: number;
}

// Different rate limit configurations for different endpoints
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'auth': { maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 }, // 5 per 15min, block for 30min
  'api-general': { maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 5 * 60 * 1000 }, // 100 per 15min
  'user-creation': { maxRequests: 3, windowMs: 15 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 }, // 3 per 15min, block for 1hr
  'repo-creation': { maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 15 * 60 * 1000 }, // 10 per 15min
  'github-api': { maxRequests: 50, windowMs: 15 * 60 * 1000, blockDurationMs: 10 * 60 * 1000 }, // 50 per 15min
};

// In-memory store (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Security event types
export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_FAILURE = 'authorization_failure',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  INVALID_INPUT = 'invalid_input',
  WEBHOOK_VERIFICATION_FAILED = 'webhook_verification_failed',
  MULTIPLE_FAILED_ATTEMPTS = 'multiple_failed_attempts',
}

interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  ip: string;
  userAgent: string;
  userId?: string;
  endpoint: string;
  details: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Security events store (in production, use a proper logging service)
const securityEvents: SecurityEvent[] = [];

export class SecurityMonitor {
  static logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    securityEvents.push(securityEvent);

    // Keep only last 1000 events in memory
    if (securityEvents.length > 1000) {
      securityEvents.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', securityEvent);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service (e.g., Sentry, DataDog, etc.)
      this.sendToMonitoringService(securityEvent);
    }

    // Check for patterns that require immediate action
    this.checkForSuspiciousPatterns(event.ip);
  }

  private static sendToMonitoringService(event: SecurityEvent) {
    // TODO: Implement integration with monitoring service
    // Example: Sentry, DataDog, CloudWatch, etc.
    console.error('Security Event (Production):', JSON.stringify(event));
  }

  private static checkForSuspiciousPatterns(ip: string) {
    const recentEvents = securityEvents.filter(
      event => event.ip === ip && 
      Date.now() - event.timestamp.getTime() < 15 * 60 * 1000 // Last 15 minutes
    );

    // Check for multiple authentication failures
    const authFailures = recentEvents.filter(
      event => event.type === SecurityEventType.AUTHENTICATION_FAILURE ||
               event.type === SecurityEventType.AUTHORIZATION_FAILURE
    );

    if (authFailures.length >= 5) {
      this.logEvent({
        type: SecurityEventType.MULTIPLE_FAILED_ATTEMPTS,
        ip,
        userAgent: 'system',
        endpoint: 'security-monitor',
        details: { failureCount: authFailures.length, timeWindow: '15min' },
        severity: 'high',
      });

      // Auto-block IP for suspicious activity
      this.blockIP(ip, 60 * 60 * 1000); // Block for 1 hour
    }

    // Check for rate limit violations
    const rateLimitViolations = recentEvents.filter(
      event => event.type === SecurityEventType.RATE_LIMIT_EXCEEDED
    );

    if (rateLimitViolations.length >= 3) {
      this.logEvent({
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        ip,
        userAgent: 'system',
        endpoint: 'security-monitor',
        details: { rateLimitViolations: rateLimitViolations.length },
        severity: 'medium',
      });
    }
  }

  private static blockIP(ip: string, durationMs: number) {
    const entry = rateLimitStore.get(`blocked-${ip}`) || {
      count: 0,
      resetTime: 0,
      blocked: false,
      blockUntil: 0,
      violations: 0,
    };

    entry.blocked = true;
    entry.blockUntil = Date.now() + durationMs;
    entry.violations++;

    rateLimitStore.set(`blocked-${ip}`, entry);

    console.warn(`IP ${ip} has been blocked for ${durationMs}ms due to suspicious activity`);
  }

  static isIPBlocked(ip: string): boolean {
    const entry = rateLimitStore.get(`blocked-${ip}`);
    if (!entry || !entry.blocked) return false;

    if (Date.now() > (entry.blockUntil || 0)) {
      // Block expired, remove it
      entry.blocked = false;
      entry.blockUntil = 0;
      return false;
    }

    return true;
  }

  static getSecurityEvents(limit = 100): SecurityEvent[] {
    return securityEvents.slice(-limit);
  }

  static getSecurityStats() {
    const now = Date.now();
    const last24h = securityEvents.filter(event => now - event.timestamp.getTime() < 24 * 60 * 60 * 1000);
    const lastHour = securityEvents.filter(event => now - event.timestamp.getTime() < 60 * 60 * 1000);

    return {
      total24h: last24h.length,
      totalLastHour: lastHour.length,
      byType: last24h.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: last24h.reduce((acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export function enhancedRateLimit(
  identifier: string,
  configKey: keyof typeof RATE_LIMIT_CONFIGS,
  request?: NextRequest
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMIT_CONFIGS[configKey];
  if (!config) {
    throw new Error(`Unknown rate limit config: ${configKey}`);
  }

  const now = Date.now();
  const key = `${configKey}-${identifier}`;
  const entry = rateLimitStore.get(key) || {
    count: 0,
    resetTime: now + config.windowMs,
    blocked: false,
    blockUntil: 0,
    violations: 0,
  };

  // Check if currently blocked
  if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
    if (request) {
      SecurityMonitor.logEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: request.url,
        details: { 
          configKey, 
          identifier, 
          blocked: true,
          blockUntil: entry.blockUntil,
        },
        severity: 'medium',
      });
    }

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockUntil,
    };
  }

  // Reset window if expired
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + config.windowMs;
    entry.blocked = false;
    entry.blockUntil = 0;
  }

  // Check rate limit
  if (entry.count >= config.maxRequests) {
    entry.violations++;

    // Block if configured and multiple violations
    if (config.blockDurationMs && entry.violations >= 2) {
      entry.blocked = true;
      entry.blockUntil = now + config.blockDurationMs;
    }

    rateLimitStore.set(key, entry);

    if (request) {
      SecurityMonitor.logEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: request.url,
        details: { 
          configKey, 
          identifier, 
          count: entry.count,
          maxRequests: config.maxRequests,
          violations: entry.violations,
        },
        severity: entry.violations >= 3 ? 'high' : 'medium',
      });
    }

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Allow request
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Utility to extract client identifier from request
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  // Use user ID if available, otherwise fall back to IP
  if (userId) {
    return `user-${userId}`;
  }

  const ip = request.ip || 
             request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';

  return `ip-${ip}`;
}

// Middleware to check if IP is blocked
export function checkIPBlock(request: NextRequest): boolean {
  const ip = request.ip || 
             request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';

  return SecurityMonitor.isIPBlocked(ip);
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime && !entry.blocked) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

