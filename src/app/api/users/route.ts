import { NextRequest, NextResponse } from 'next/server';
import { createInitialUser, getUserByClerkId } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Try to get auth context first
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(null, { status: 401 });
    }
    
    // Get user directly by clerk ID to avoid auth context issues
    const user = await getUserByClerkId(userId);
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(null, { status: 500 });
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

    // Use createInitialUser instead of createOrUpdateUser to avoid auth context issues during user creation
    const user = await createInitialUser({
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