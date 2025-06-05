import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDbWithAuth } from '@/lib/db';
import { IntelligentAdService } from '@/lib/intelligent-ad-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sql } = await getDbWithAuth();
    const body = await request.json();
    const { repositoryId, readmeContent } = body;

    if (!repositoryId || !readmeContent) {
      return NextResponse.json(
        { error: 'Repository ID and README content are required' },
        { status: 400 }
      );
    }

    // Get repository data
    const repository = await sql`
      SELECT * FROM repositories 
      WHERE id = ${repositoryId} AND user_id = (
        SELECT id FROM users WHERE clerk_id = ${userId}
      )
    `;

    if (repository.length === 0) {
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

    // Store analysis results in database
    await sql`
      INSERT INTO content_analysis (
        repository_id, readme_content, content_hash, technologies, topics,
        sentiment_score, complexity_score, target_audience, sections,
        code_blocks, optimal_placements, analysis_version
      ) VALUES (
        ${repositoryId}, ${readmeContent}, ${contentAnalysis.contentHash},
        ${JSON.stringify(contentAnalysis.technologies)}, ${JSON.stringify(contentAnalysis.topics)},
        ${contentAnalysis.sentimentScore}, ${contentAnalysis.complexityScore},
        ${contentAnalysis.targetAudience}, ${JSON.stringify(contentAnalysis.sections)},
        ${JSON.stringify(contentAnalysis.codeBlocks)}, ${JSON.stringify(contentAnalysis.optimalPlacements)},
        ${contentAnalysis.analysisVersion}
      )
      ON CONFLICT (repository_id) 
      DO UPDATE SET
        readme_content = EXCLUDED.readme_content,
        content_hash = EXCLUDED.content_hash,
        technologies = EXCLUDED.technologies,
        topics = EXCLUDED.topics,
        sentiment_score = EXCLUDED.sentiment_score,
        complexity_score = EXCLUDED.complexity_score,
        target_audience = EXCLUDED.target_audience,
        sections = EXCLUDED.sections,
        code_blocks = EXCLUDED.code_blocks,
        optimal_placements = EXCLUDED.optimal_placements,
        analysis_version = EXCLUDED.analysis_version,
        updated_at = now()
    `;

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