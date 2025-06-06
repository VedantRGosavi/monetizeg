import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createInitialUser } from '@/lib/db';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate required user data
    if (!user.emailAddresses || user.emailAddresses.length === 0) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Create or update user in database
    const dbUser = await createInitialUser({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    });

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error('Error initializing user:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('User email is required')) {
        return NextResponse.json(
          { error: 'User email is required' },
          { status: 400 }
        );
      }
      if (error.message.includes('Database')) {
        return NextResponse.json(
          { error: 'Database connection error. Please try again.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize user',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
} 