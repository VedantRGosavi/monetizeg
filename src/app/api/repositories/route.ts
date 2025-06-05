import { NextRequest, NextResponse } from 'next/server';
import { createRepository, getRepositories } from '@/lib/db';

export async function GET() {
  try {
    const repositories = await getRepositories();
    return NextResponse.json(repositories);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    
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
    const body = await request.json();
    
    const { fullName, description, stars, forks, language, isPrivate } = body;
    
    if (!fullName) {
      return NextResponse.json(
        { error: 'Missing required field: fullName' },
        { status: 400 }
      );
    }

    const repository = await createRepository({
      fullName,
      description,
      stars: stars ? parseInt(stars) : undefined,
      forks: forks ? parseInt(forks) : undefined,
      language,
      isPrivate: Boolean(isPrivate),
    });

    return NextResponse.json(repository, { status: 201 });
  } catch (error) {
    console.error('Error creating repository:', error);
    
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
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create repository' },
      { status: 500 }
    );
  }
} 