import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const githubToken = cookieStore.get('github_access_token');

    if (!githubToken) {
      return NextResponse.json(
        { error: 'No GitHub access token found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      token: githubToken.value,
      hasToken: true 
    });
  } catch (error) {
    console.error('Error retrieving GitHub token:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve GitHub token' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    
    // Clear the GitHub access token cookie
    response.cookies.set('github_access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Error clearing GitHub token:', error);
    return NextResponse.json(
      { error: 'Failed to clear GitHub token' },
      { status: 500 }
    );
  }
} 