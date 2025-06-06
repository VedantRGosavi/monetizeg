import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { Octokit } from '@octokit/rest';

/**
 * GET /api/github/token
 * Returns token status (has token or not) but never the actual token
 */
export async function GET() {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { 
        githubAccessToken: true,
        githubUsername: true 
      }
    });

    // Check if token exists
    const hasToken = Boolean(user?.githubAccessToken);

    return NextResponse.json({
      hasToken,
      githubUsername: user?.githubUsername || null
    });
  } catch (error) {
    console.error('Error checking GitHub token status:', error);
    return NextResponse.json(
      { error: 'Failed to check GitHub token status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/github/token
 * Accepts and securely stores a new GitHub token after validation
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid token provided' },
        { status: 400 }
      );
    }

    // Validate token with GitHub API
    try {
      const octokit = new Octokit({ auth: token });
      const { data: githubUser } = await octokit.users.getAuthenticated();

      if (!githubUser || !githubUser.login) {
        return NextResponse.json(
          { error: 'Invalid GitHub token' },
          { status: 400 }
        );
      }

      // Encrypt token before storing
      const encryptedToken = encrypt(token);

      // Store token and GitHub username in database
      await prisma.user.update({
        where: { clerkId: userId },
        data: {
          githubAccessToken: encryptedToken,
          githubUsername: githubUser.login,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        githubUsername: githubUser.login
      });
    } catch (githubError) {
      console.error('GitHub API validation error:', githubError);
      return NextResponse.json(
        { error: 'Invalid GitHub token or API error' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error storing GitHub token:', error);
    return NextResponse.json(
      { error: 'Failed to store GitHub token' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/github/token
 * Removes the stored token from database
 */
export async function DELETE() {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove token from database
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        githubAccessToken: null,
        githubUsername: null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing GitHub token:', error);
    return NextResponse.json(
      { error: 'Failed to remove GitHub token' },
      { status: 500 }
    );
  }
}
