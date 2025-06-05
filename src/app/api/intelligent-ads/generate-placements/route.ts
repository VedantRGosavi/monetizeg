import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { IntelligentAdService, RepositoryData, IntelligentPlacementRequest } from '@/lib/intelligent-ad-service';
import { AdCreative } from '@/lib/ad-placement-engine';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get user first
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get repository data with content analysis using Prisma
    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: user.id
      },
      include: {
        contentAnalysis: true
      }
    });

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found or access denied' },
        { status: 404 }
      );
    }

    if (!repository.isMonetized || !repository.adPlacementEnabled) {
      return NextResponse.json(
        { error: 'Repository monetization or ad placement is not enabled' },
        { status: 400 }
      );
    }

    if (!repository.contentAnalysis?.readmeContent) {
      return NextResponse.json(
        { error: 'No README content found. Please analyze the repository content first.' },
        { status: 400 }
      );
    }

    // Get available ads based on repository profile
    const availableAds = await getAvailableAds(repository);

    if (availableAds.length === 0) {
      return NextResponse.json(
        { error: 'No suitable ads available for this repository' },
        { status: 404 }
      );
    }

    // Prepare repository data for intelligent service
    const repositoryData_: RepositoryData = {
      id: repository.id,
      fullName: repository.fullName,
      description: repository.description,
      stars: repository.stars,
      forks: repository.forks,
      language: repository.language,
      readmeContent: repository.contentAnalysis.readmeContent,
      isMonetized: repository.isMonetized,
      adPlacementEnabled: repository.adPlacementEnabled,
      adPlacementMaxAds: repository.adPlacementMaxAds,
      adPlacementPosition: repository.adPlacementPosition,
      adPlacementCategories: repository.adPlacementCategories
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

    // Store placement results in database using Prisma
    if (result.placements.length > 0) {
      // Remove existing placements
      await prisma.adPlacement.updateMany({
        where: {
          repositoryId,
          isActive: true
        },
        data: {
          isActive: false,
          endDate: new Date()
        }
      });

      // Insert new placements
      for (const placement of result.placements) {
        const campaignId = placement.adCreativeId.split('_')[0] || 'default';
        
        await prisma.adPlacement.create({
          data: {
            repositoryId,
            campaignId,
            adCreativeId: placement.adCreativeId,
            position: placement.position,
            section: placement.section,
            placementType: 'auto',
            abTestId: result.abTest?.id,
            variant: enableABTesting ? 'A' : null,
            isActive: true
          }
        });
      }
    }

    // Store A/B test if created
    if (result.abTest) {
      await prisma.aBTest.upsert({
        where: { id: result.abTest.id },
        update: {
          status: result.abTest.status,
          updatedAt: new Date()
        },
        create: {
          id: result.abTest.id,
          repositoryId,
          campaignId: result.abTest.campaignId,
          name: result.abTest.name,
          description: result.abTest.description,
          testType: result.abTest.testType,
          variants: JSON.stringify(result.abTest.variants),
          trafficSplit: result.abTest.trafficSplit,
          status: result.abTest.status,
          startDate: result.abTest.startDate,
          endDate: result.abTest.endDate,
          minSampleSize: result.abTest.minSampleSize,
          confidenceLevel: result.abTest.confidenceLevel
        }
      });
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
 * Get available ads based on repository characteristics using Prisma
 */
async function getAvailableAds(repository: {
  id: string;
  language: string | null;
  stars: number;
}): Promise<AdCreative[]> {
  try {
    // Get active campaigns with ads that match repository criteria
    const ads = await prisma.adCreative.findMany({
      where: {
        isActive: true,
        campaign: {
          status: 'active',
          startDate: {
            lte: new Date()
          },
          OR: [
            { endDate: null },
            { endDate: { gt: new Date() } }
          ],
          budgetSpent: {
            lt: prisma.campaign.fields.budgetTotal
          },
          AND: [
            {
              targetLanguages: repository.language
                ? { has: repository.language }
                : { isEmpty: true }
            },
            {
              OR: [
                { minRepositoryStars: null },
                { minRepositoryStars: { lte: repository.stars } }
              ]
            },
            {
              OR: [
                { maxRepositoryStars: null },
                { maxRepositoryStars: { gte: repository.stars } }
              ]
            }
          ]
        }
      },
      include: {
        campaign: {
          select: {
            id: true,
            targetLanguages: true,
            targetTopics: true,
            targetAudienceTypes: true,
            minRepositoryStars: true,
            maxRepositoryStars: true
          }
        }
      },
      orderBy: [
        { ctr: 'desc' },
        { impressions: 'desc' }
      ],
      take: 20
    });

    return ads.map((ad): AdCreative => ({
      id: ad.id,
      campaignId: ad.campaignId,
      name: ad.name,
      format: ad.format as 'banner' | 'text' | 'card' | 'native',
      content: typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content,
      ctaText: ad.ctaText || undefined,
      ctaUrl: ad.ctaUrl,
      targeting: {
        languages: ad.campaign.targetLanguages || [],
        topics: ad.campaign.targetTopics || [],
        audienceTypes: ad.campaign.targetAudienceTypes || [],
        minStars: ad.campaign.minRepositoryStars || undefined,
        maxStars: ad.campaign.maxRepositoryStars || undefined
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