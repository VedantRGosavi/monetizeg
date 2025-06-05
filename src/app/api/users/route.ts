import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateUser, getCurrentUser, getUserByClerkId } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Try to get current user with auth first
    let user = await getCurrentUser();
    
    // If that fails, try to get user by clerk ID from auth
    if (!user) {
      try {
        const { userId } = await auth();
        if (userId) {
          user = await getUserByClerkId(userId);
        }
      } catch (error) {
        console.error('Auth error in GET /api/users:', error);
      }
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(null);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { id, emailAddresses, firstName, lastName, imageUrl } = body;
    
    if (!id || !emailAddresses) {
      return NextResponse.json(
        { error: 'Missing required fields: id, emailAddresses' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByClerkId(id);
    if (existingUser) {
      return NextResponse.json(existingUser, { status: 200 });
    }

    const user = await createOrUpdateUser({
      id,
      emailAddresses,
      firstName,
      lastName,
      imageUrl,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 