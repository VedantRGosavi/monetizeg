import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDbWithAuth } from '@/lib/db';
import { IntelligentAdService, RepositoryData, IntelligentPlacementRequest } from '@/lib/intelligent-ad-service';
import { AdCreative } from '@/lib/ad-placement-engine';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sql } = await getDbWithAuth();
    const body = await request.json();
    const { 
      repositoryId, 
      enableABTesting = false, 
      abTestConfig
    } = body;

    if (!repositoryId) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }

    // Get repository data with owner verification
    const repositoryData = await sql`
      SELECT r.*, ca.readme_content, ca.technologies, ca.topics, ca.target_audience
      FROM repositories r
      LEFT JOIN content_analysis ca ON r.id = ca.repository_id
      WHERE r.id = ${repositoryId} AND r.user_id = (
        SELECT id FROM users WHERE clerk_id = ${userId}
      )
    `;

    if (repositoryData.length === 0) {
      return NextResponse.json(
        { error: 'Repository not found or access denied' },
        { status: 404 }
      );
    }

    const repo = repositoryData[0];

    if (!repo.is_monetized || !repo.ad_placement_enabled) {
      return NextResponse.json(
        { error: 'Repository monetization or ad placement is not enabled' },
        { status: 400 }
      );
    }

    if (!repo.readme_content) {
      return NextResponse.json(
        { error: 'No README content found. Please analyze the repository content first.' },
        { status: 400 }
      );
    }

    // Get available ads based on repository profile
    const availableAds = await getAvailableAds(sql, repo);

    if (availableAds.length === 0) {
      return NextResponse.json(
        { error: 'No suitable ads available for this repository' },
        { status: 404 }
      );
    }

    // Prepare repository data for intelligent service
    const repositoryData_: RepositoryData = {
      id: repo.id,
      fullName: repo.full_name,
      description: repo.description,
      stars: repo.stars,
      forks: repo.forks,
      language: repo.language,
      readmeContent: repo.readme_content,
      isMonetized: repo.is_monetized,
      adPlacementEnabled: repo.ad_placement_enabled,
      adPlacementMaxAds: repo.ad_placement_max_ads,
      adPlacementPosition: repo.ad_placement_position,
      adPlacementCategories: repo.ad_placement_categories || []
    };

    // Prepare placement request
    const placementRequest: IntelligentPlacementRequest = {
      repository: repositoryData_,
      availableAds,
      enableABTesting,
      abTestConfig
    };

    // Generate intelligent placements
    const intelligentAdService = new IntelligentAdService();
    const result = await intelligentAdService.generateIntelligentPlacements(placementRequest);

    // Store placement results in database
    if (result.placements.length > 0) {
      // Remove existing placements
      await sql`
        UPDATE ad_placements 
        SET is_active = false, end_date = now()
        WHERE repository_id = ${repositoryId} AND is_active = true
      `;

      // Insert new placements
      for (const placement of result.placements) {
        await sql`
          INSERT INTO ad_placements (
            repository_id, campaign_id, ad_creative_id, position, section,
            placement_type, ab_test_id, variant, is_active
          ) VALUES (
            ${repositoryId}, 
            ${placement.adCreativeId.split('_')[0] || 'default'}, -- Extract campaign ID
            ${placement.adCreativeId},
            ${placement.position},
            ${placement.section},
            'auto',
            ${result.abTest?.id || null},
            ${enableABTesting ? 'A' : null},
            true
          )
        `;
      }
    }

    // Store A/B test if created
    if (result.abTest) {
      await sql`
        INSERT INTO ab_tests (
          id, repository_id, campaign_id, name, description, test_type,
          variants, traffic_split, status, start_date, end_date,
          min_sample_size, confidence_level
        ) VALUES (
          ${result.abTest.id}, ${repositoryId}, ${result.abTest.campaignId},
          ${result.abTest.name}, ${result.abTest.description}, ${result.abTest.testType},
          ${JSON.stringify(result.abTest.variants)}, ${JSON.stringify(result.abTest.trafficSplit)},
          ${result.abTest.status}, ${result.abTest.startDate.toISOString()},
          ${result.abTest.endDate?.toISOString() || null},
          ${result.abTest.minSampleSize}, ${result.abTest.confidenceLevel}
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = now()
      `;
    }

    return NextResponse.json({
      success: true,
      result: {
        placementCount: result.placements.length,
        confidence: result.confidence,
        reasoning: result.reasoning,
        abTestCreated: !!result.abTest,
        abTestId: result.abTest?.id,
        placements: result.placements.map(p => ({
          position: p.position,
          section: p.section,
          format: p.format,
          score: p.score,
          reasoning: p.reasoning
        })),
        contentAnalysis: {
          technologies: result.contentAnalysis.technologies,
          topics: result.contentAnalysis.topics,
          targetAudience: result.contentAnalysis.targetAudience,
          sentimentScore: result.contentAnalysis.sentimentScore,
          complexityScore: result.contentAnalysis.complexityScore
        }
      }
    });

  } catch (error) {
    console.error('Error generating intelligent placements:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate placements',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get available ads based on repository characteristics
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAvailableAds(sql: any, repository: any): Promise<AdCreative[]> {
  try {
    // Get active campaigns with ads that match repository criteria
    const ads = await sql`
      SELECT 
        ac.id, ac.campaign_id, ac.name, ac.format, ac.content, 
        ac.cta_text, ac.cta_url, ac.impressions, ac.clicks, ac.ctr,
        c.target_languages, c.target_topics, c.target_audience_types,
        c.min_repository_stars, c.max_repository_stars
      FROM ad_creatives ac
      JOIN campaigns c ON ac.campaign_id = c.id
      WHERE ac.is_active = true 
        AND c.status = 'active'
        AND c.start_date <= now()
        AND (c.end_date IS NULL OR c.end_date > now())
        AND c.budget_total > c.budget_spent
        AND (
          c.target_languages = '{}' OR 
          ${repository.language} = ANY(c.target_languages) OR
          c.target_languages IS NULL
        )
        AND (
          c.min_repository_stars IS NULL OR 
          ${repository.stars} >= c.min_repository_stars
        )
        AND (
          c.max_repository_stars IS NULL OR 
          ${repository.stars} <= c.max_repository_stars
        )
      ORDER BY ac.ctr DESC, ac.impressions DESC
      LIMIT 20
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ads.map((ad: any): AdCreative => ({
      id: ad.id,
      campaignId: ad.campaign_id,
      name: ad.name,
      format: ad.format,
      content: typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content,
      ctaText: ad.cta_text,
      ctaUrl: ad.cta_url,
      targeting: {
        languages: ad.target_languages || [],
        topics: ad.target_topics || [],
        audienceTypes: ad.target_audience_types || [],
        minStars: ad.min_repository_stars,
        maxStars: ad.max_repository_stars
      },
      performance: {
        impressions: ad.impressions || 0,
        clicks: ad.clicks || 0,
        ctr: ad.ctr || 0
      }
    }));

  } catch (error) {
    console.error('Error getting available ads:', error);
    return [];
  }
} 