import { NextRequest, NextResponse } from 'next/server';
import { createInitialUser, getUserByClerkId } from '@/lib/db';
import { requireAuth, validateUserAccess, checkRateLimit, addSecurityHeaders, AuthenticationError, AuthorizationError } from '@/lib/auth-utils';

export async function GET() {
  try {
    // Require authentication for getting user data
    const userId = await requireAuth();
    
    // Get user directly by clerk ID
    const user = await getUserByClerkId(userId);
    
    const response = NextResponse.json(user);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    if (!checkRateLimit('user-creation', request)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { id, emailAddresses, firstName, lastName, imageUrl } = body;
    
    // Validate required fields
    if (!id || !emailAddresses || !Array.isArray(emailAddresses) || emailAddresses.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: id, emailAddresses' },
        { status: 400 }
      );
    }

    // Validate email format
    const email = emailAddresses[0]?.emailAddress;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // For user creation, we need to handle two scenarios:
    // 1. Initial user creation (from Clerk webhook or first sign-in) - no auth required
    // 2. User update (from authenticated user) - auth required
    
    // Check if this is an authenticated request
    try {
      const authenticatedUserId = await requireAuth();
      
      // If authenticated, validate that the user can only create/update their own record
      validateUserAccess(authenticatedUserId, id);
      
      // Check if user already exists
      const existingUser = await getUserByClerkId(id);
      if (existingUser) {
        return NextResponse.json(existingUser, { status: 200 });
      }

      // Create user with authentication context
      const user = await createInitialUser({
        id,
        emailAddresses,
        firstName,
        lastName,
        imageUrl,
      });

      const response = NextResponse.json(user, { status: 201 });
      return addSecurityHeaders(response);
      
    } catch {
      // If not authenticated, this might be a webhook or initial creation
      // We need to be very careful here and validate the request source
      
      // Check if this looks like a legitimate Clerk webhook or initial user creation
      const userAgent = request.headers.get('user-agent') || '';
      const origin = request.headers.get('origin') || '';
      
      // Only allow unauthenticated user creation from specific sources
      const isValidSource = 
        userAgent.includes('Clerk') || // Clerk webhook
        origin === process.env.NEXT_PUBLIC_APP_URL || // Same origin
        !origin; // Server-side request
      
      if (!isValidSource) {
        return NextResponse.json(
          { error: 'Unauthorized user creation attempt' },
          { status: 403 }
        );
      }

      // Check if user already exists
      const existingUser = await getUserByClerkId(id);
      if (existingUser) {
        return NextResponse.json(existingUser, { status: 200 });
      }

      // Create user for initial setup
      const user = await createInitialUser({
        id,
        emailAddresses,
        firstName,
        lastName,
        imageUrl,
      });

      const response = NextResponse.json(user, { status: 201 });
      return addSecurityHeaders(response);
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create/update user',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
} 