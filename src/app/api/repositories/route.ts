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
    return NextResponse.json(
      { error: 'Failed to create repository' },
      { status: 500 }
    );
  }
} 