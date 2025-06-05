import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { IntelligentAdService } from '@/lib/intelligent-ad-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { repositoryId, readmeContent } = body;

    if (!repositoryId || !readmeContent) {
      return NextResponse.json(
        { error: 'Repository ID and README content are required' },
        { status: 400 }
      );
    }

    // Get repository data using Prisma
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: user.id
      }
    });

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    // Initialize intelligent ad service
    const intelligentAdService = new IntelligentAdService();

    // Analyze content
    const contentAnalysis = await intelligentAdService['contentAnalyzer'].analyzeContent(
      repositoryId,
      readmeContent
    );

    // Store analysis results in database using Prisma
    await prisma.contentAnalysis.upsert({
      where: { repositoryId },
      update: {
        readmeContent,
        contentHash: contentAnalysis.contentHash,
        technologies: contentAnalysis.technologies,
        topics: contentAnalysis.topics,
        sentimentScore: contentAnalysis.sentimentScore,
        complexityScore: contentAnalysis.complexityScore,
        targetAudience: contentAnalysis.targetAudience,
        sections: contentAnalysis.sections,
        codeBlocks: contentAnalysis.codeBlocks,
        optimalPlacements: contentAnalysis.optimalPlacements,
        analysisVersion: contentAnalysis.analysisVersion,
        updatedAt: new Date(),
      },
      create: {
        repositoryId,
        readmeContent,
        contentHash: contentAnalysis.contentHash,
        technologies: contentAnalysis.technologies,
        topics: contentAnalysis.topics,
        sentimentScore: contentAnalysis.sentimentScore,
        complexityScore: contentAnalysis.complexityScore,
        targetAudience: contentAnalysis.targetAudience,
        sections: contentAnalysis.sections,
        codeBlocks: contentAnalysis.codeBlocks,
        optimalPlacements: contentAnalysis.optimalPlacements,
        analysisVersion: contentAnalysis.analysisVersion,
      }
    });

    return NextResponse.json({
      success: true,
      analysis: {
        contentHash: contentAnalysis.contentHash,
        technologies: contentAnalysis.technologies,
        topics: contentAnalysis.topics,
        sentimentScore: contentAnalysis.sentimentScore,
        complexityScore: contentAnalysis.complexityScore,
        targetAudience: contentAnalysis.targetAudience,
        sections: contentAnalysis.sections.length,
        codeBlocks: contentAnalysis.codeBlocks.length,
        optimalPlacements: contentAnalysis.optimalPlacements,
        analysisVersion: contentAnalysis.analysisVersion,
        processedAt: contentAnalysis.processedAt
      }
    });

  } catch (error) {
    console.error('Error analyzing content:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
} 