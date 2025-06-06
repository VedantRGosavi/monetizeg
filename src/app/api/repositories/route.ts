import { NextRequest, NextResponse } from 'next/server';
import { createRepository, getRepositories } from '@/lib/db';
import { requireAuth, checkRateLimit, addSecurityHeaders, AuthenticationError } from '@/lib/auth-utils';

export async function GET() {
  try {
    // Require authentication for getting repositories
    await requireAuth();
    
    const repositories = await getRepositories();
    const response = NextResponse.json(repositories);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // If it's a user not found error, return empty array
    if (error instanceof Error && error.message.includes('User not found')) {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication for creating repositories
    const userId = await requireAuth();
    
    // Rate limiting check
    if (!checkRateLimit('repo-creation', request, userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { fullName, description, stars, forks, language, isPrivate } = body;
    
    // Validate required fields
    if (!fullName || typeof fullName !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: fullName' },
        { status: 400 }
      );
    }

    // Validate fullName format (should be owner/repo)
    if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(fullName)) {
      return NextResponse.json(
        { error: 'Invalid repository name format. Expected: owner/repository' },
        { status: 400 }
      );
    }

    // Validate optional numeric fields
    const parsedStars = stars ? parseInt(stars) : undefined;
    const parsedForks = forks ? parseInt(forks) : undefined;
    
    if (stars && (parsedStars === undefined || isNaN(parsedStars) || parsedStars < 0)) {
      return NextResponse.json(
        { error: 'Invalid stars value' },
        { status: 400 }
      );
    }
    
    if (forks && (parsedForks === undefined || isNaN(parsedForks) || parsedForks < 0)) {
      return NextResponse.json(
        { error: 'Invalid forks value' },
        { status: 400 }
      );
    }

    const repository = await createRepository({
      fullName,
      description: description || null,
      stars: parsedStars,
      forks: parsedForks,
      language: language || null,
      isPrivate: Boolean(isPrivate),
    });

    const response = NextResponse.json(repository, { status: 201 });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating repository:', error);
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('User not found')) {
        return NextResponse.json(
          { error: 'User not found in database. Please refresh the page and try again.' },
          { status: 404 }
        );
      }
      if (error.message.includes('already connected')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create repository' },
      { status: 500 }
    );
  }
} 