import { ContentAnalysisService, ContentAnalysisResult } from './content-analysis';
import { AdPlacementEngine, PlacementRecommendation, PlacementContext, AdCreative } from './ad-placement-engine';
import { ABTestingFramework, ABTestConfig, ABTestVariant } from './ab-testing-framework';

export interface RepositoryData {
  id: string;
  fullName: string;
  description?: string;
  stars: number;
  forks: number;
  language: string;
  readmeContent: string;
  isMonetized: boolean;
  adPlacementEnabled: boolean;
  adPlacementMaxAds: number;
  adPlacementPosition: string;
  adPlacementCategories: string[];
}

export interface IntelligentPlacementRequest {
  repository: RepositoryData;
  availableAds: AdCreative[];
  enableABTesting?: boolean;
  abTestConfig?: {
    name: string;
    description?: string;
    testType: 'placement' | 'creative' | 'format';
    variants: Omit<ABTestVariant, 'id'>[];
    trafficSplit: Record<string, number>;
    duration?: number; // days
  };
}

export interface IntelligentPlacementResult {
  contentAnalysis: ContentAnalysisResult;
  placements: PlacementRecommendation[];
  abTest?: ABTestConfig;
  confidence: number;
  reasoning: string[];
  modifiedReadme: string;
}

export class IntelligentAdService {
  private contentAnalyzer: ContentAnalysisService;
  private placementEngine: AdPlacementEngine;
  private abTestFramework: ABTestingFramework;

  constructor() {
    this.contentAnalyzer = new ContentAnalysisService();
    this.placementEngine = new AdPlacementEngine();
    this.abTestFramework = new ABTestingFramework();
  }

  /**
   * Generate intelligent ad placements for a repository
   */
  async generateIntelligentPlacements(
    request: IntelligentPlacementRequest
  ): Promise<IntelligentPlacementResult> {
    const { repository, availableAds, enableABTesting, abTestConfig } = request;

    try {
      // Step 1: Analyze repository content
      console.log(`Analyzing content for repository: ${repository.fullName}`);
      const contentAnalysis = await this.contentAnalyzer.analyzeContent(
        repository.id,
        repository.readmeContent
      );

      // Step 2: Create placement context
      const placementContext: PlacementContext = {
        repositoryId: repository.id,
        repositoryStars: repository.stars,
        repositoryLanguage: repository.language,
        contentAnalysis,
        maxAds: repository.adPlacementMaxAds,
        allowedFormats: this.determineAllowedFormats(repository),
        excludeSections: this.determineExcludedSections(repository)
      };

      // Step 3: Generate placement recommendations
      console.log('Generating placement recommendations...');
      const placements = await this.placementEngine.generatePlacements(
        placementContext,
        availableAds
      );

      // Step 4: Setup A/B testing if enabled
      let abTest: ABTestConfig | undefined;
      if (enableABTesting && abTestConfig && placements.length > 0) {
        console.log('Setting up A/B test...');
        abTest = await this.setupABTest(
          repository,
          placements,
          abTestConfig
        );
      }

      // Step 5: Generate modified README
      const modifiedReadme = this.generateModifiedReadme(
        repository.readmeContent,
        placements,
        abTest
      );

      // Step 6: Calculate confidence and generate reasoning
      const confidence = this.calculatePlacementConfidence(
        contentAnalysis,
        placements,
        availableAds
      );

      const reasoning = this.generatePlacementReasoning(
        contentAnalysis,
        placements,
        repository
      );

      return {
        contentAnalysis,
        placements,
        abTest,
        confidence,
        reasoning,
        modifiedReadme
      };

    } catch (error) {
      console.error('Error generating intelligent placements:', error);
      throw new Error(`Failed to generate intelligent placements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze placement performance and update recommendations
   */
  async optimizePlacements(repositoryId: string): Promise<{
    recommendations: string[];
    optimizedPlacements: PlacementRecommendation[];
    confidence: number;
  }> {
    // TODO: Implement performance analysis and optimization
    // This would analyze historical performance data to improve future placements
    
    console.log(`Optimizing placements for repository: ${repositoryId}`);
    
    return {
      recommendations: [
        'Increase native ad usage based on higher engagement',
        'Consider testing placement before installation section',
        'Technology targeting is performing well - maintain current strategy'
      ],
      optimizedPlacements: [],
      confidence: 0.85
    };
  }

  /**
   * Setup A/B test for ad placements
   */
  private async setupABTest(
    repository: RepositoryData,
    placements: PlacementRecommendation[],
    abTestConfig: IntelligentPlacementRequest['abTestConfig']
  ): Promise<ABTestConfig> {
    if (!abTestConfig) {
      throw new Error('A/B test configuration is required');
    }

    // Generate variants based on placement recommendations
    const variants: ABTestVariant[] = abTestConfig.variants.map((variant, variantIndex) => ({
      ...variant,
      id: `variant_${variantIndex + 1}`,
      config: {
        ...variant.config,
        placements: this.generateVariantPlacements(placements, variant, variantIndex)
      }
    }));

    // Create A/B test configuration
    const testConfig: Omit<ABTestConfig, 'id' | 'status'> = {
      repositoryId: repository.id,
      campaignId: placements[0]?.adCreativeId || 'default',
      name: abTestConfig.name,
      description: abTestConfig.description,
      testType: abTestConfig.testType,
      variants,
      trafficSplit: abTestConfig.trafficSplit,
      startDate: new Date(),
      endDate: abTestConfig.duration 
        ? new Date(Date.now() + abTestConfig.duration * 24 * 60 * 60 * 1000)
        : undefined,
      minSampleSize: Math.max(100, repository.stars * 0.01), // Dynamic based on repo size
      confidenceLevel: 0.95
    };

    return this.abTestFramework.createTest(testConfig);
  }

  /**
   * Generate variant placements for A/B testing
   */
  private generateVariantPlacements(
    basePlacements: PlacementRecommendation[],
    variant: Omit<ABTestVariant, 'id'>,
    variantIndex: number
  ): PlacementRecommendation[] {
    // Create variations based on variant configuration
    switch (variant.name.toLowerCase()) {
      case 'control':
      case 'a':
        return basePlacements.slice(0, 1); // Single placement

      case 'multiple':
      case 'b':
        return basePlacements.slice(0, 2); // Multiple placements

      case 'native':
      case 'c':
        return basePlacements
          .filter(p => p.format === 'native')
          .slice(0, 1);

      case 'banner':
      case 'd':
        return basePlacements
          .filter(p => p.format === 'banner')
          .slice(0, 1);

      default:
        // Custom variant - use different positions
        return basePlacements
          .map((placement) => ({
            ...placement,
            position: placement.position + (variantIndex * 10)
          }))
          .slice(0, 1);
    }
  }

  /**
   * Generate modified README with ad placements
   */
  private generateModifiedReadme(
    originalReadme: string,
    placements: PlacementRecommendation[],
    abTest?: ABTestConfig
  ): string {
    if (placements.length === 0) {
      return originalReadme;
    }

    const lines = originalReadme.split('\n');
    const modifications: Array<{ position: number; content: string }> = [];

    // Add placements (sorted by position, descending to avoid index shifts)
    const sortedPlacements = [...placements].sort((a, b) => b.position - a.position);

    sortedPlacements.forEach(placement => {
      // Add A/B test tracking if test is active
      let content = placement.renderedContent;
      
      if (abTest) {
        content += `\n<!-- AB_TEST:${abTest.id}:${placement.adCreativeId} -->`;
      }

      modifications.push({
        position: placement.position,
        content: content
      });
    });

    // Apply modifications
    modifications.forEach(modification => {
      lines.splice(modification.position, 0, modification.content);
    });

    return lines.join('\n');
  }

  /**
   * Calculate placement confidence score
   */
  private calculatePlacementConfidence(
    contentAnalysis: ContentAnalysisResult,
    placements: PlacementRecommendation[],
    availableAds: AdCreative[]
  ): number {
    if (placements.length === 0) {
      return 0;
    }

    // Factors contributing to confidence
    const factors = {
      contentQuality: this.assessContentQuality(contentAnalysis),
      adRelevance: this.assessAdRelevance(placements, contentAnalysis),
      placementQuality: this.assessPlacementQuality(placements),
      adInventory: Math.min(availableAds.length / 10, 1.0)
    };

    // Weighted average
    const weights = {
      contentQuality: 0.3,
      adRelevance: 0.4,
      placementQuality: 0.2,
      adInventory: 0.1
    };

    const confidence = Object.entries(factors).reduce(
      (sum, [factor, value]) => sum + value * weights[factor as keyof typeof weights],
      0
    );

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Assess content quality for ad placement
   */
  private assessContentQuality(contentAnalysis: ContentAnalysisResult): number {
    const factors = [
      contentAnalysis.sentimentScore,
      1 - contentAnalysis.complexityScore, // Lower complexity is better for ads
      Math.min(contentAnalysis.sections.length / 8, 1), // Structured content
      Math.min(contentAnalysis.optimalPlacements.length / 3, 1) // Placement opportunities
    ];

    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  /**
   * Assess ad relevance to content
   */
  private assessAdRelevance(
    placements: PlacementRecommendation[],
    contentAnalysis: ContentAnalysisResult
  ): number {
    if (placements.length === 0) {
      return 0;
    }

    // Consider content analysis for relevance scoring
    const contentBonus = contentAnalysis.technologies.languages.length > 0 ? 0.1 : 0;
    const averageScore = placements.reduce((sum, placement) => sum + placement.score, 0) / placements.length;
    return Math.min(averageScore + contentBonus, 1.0);
  }

  /**
   * Assess placement quality
   */
  private assessPlacementQuality(placements: PlacementRecommendation[]): number {
    if (placements.length === 0) {
      return 0;
    }

    // Consider diversity of placement types and positions
    const formatDiversity = new Set(placements.map(p => p.format)).size / 4; // 4 possible formats
    const positionSpread = this.calculatePositionSpread(placements);

    return (formatDiversity + positionSpread) / 2;
  }

  /**
   * Calculate position spread score
   */
  private calculatePositionSpread(placements: PlacementRecommendation[]): number {
    if (placements.length <= 1) {
      return 1.0;
    }

    const positions = placements.map(p => p.position).sort((a, b) => a - b);
    const totalSpread = positions[positions.length - 1] - positions[0];
    const idealSpread = 100; // Assume README is ~100 lines

    return Math.min(totalSpread / idealSpread, 1.0);
  }

  /**
   * Generate placement reasoning
   */
  private generatePlacementReasoning(
    contentAnalysis: ContentAnalysisResult,
    placements: PlacementRecommendation[],
    repository: RepositoryData
  ): string[] {
    const reasoning: string[] = [];

    // Content analysis insights
    if (contentAnalysis.technologies.languages.length > 0) {
      const topLang = contentAnalysis.technologies.languages[0];
      reasoning.push(`Detected primary technology: ${topLang.name} (${(topLang.confidence * 100).toFixed(1)}% confidence)`);
    }

    if (contentAnalysis.topics.length > 0) {
      const topTopic = contentAnalysis.topics[0];
      reasoning.push(`Primary topic classification: ${topTopic.name} (${(topTopic.confidence * 100).toFixed(1)}% confidence)`);
    }

    reasoning.push(`Target audience identified as: ${contentAnalysis.targetAudience}`);

    // Placement strategy
    if (placements.length > 0) {
      reasoning.push(`Selected ${placements.length} optimal placement${placements.length > 1 ? 's' : ''} based on content structure`);
      
      const topPlacement = placements[0];
      reasoning.push(`Top placement: ${topPlacement.section} (score: ${(topPlacement.score * 100).toFixed(1)}%)`);
    }

    // Repository context
    if (repository.stars > 1000) {
      reasoning.push(`High-visibility repository (${repository.stars} stars) - premium placement opportunities`);
    }

    if (repository.language && contentAnalysis.technologies.languages.some(lang => 
      lang.name.toLowerCase() === repository.language.toLowerCase())) {
      reasoning.push('Repository language aligns with content analysis - improved targeting accuracy');
    }

    return reasoning;
  }

  /**
   * Determine allowed ad formats based on repository settings
   */
  private determineAllowedFormats(repository: RepositoryData): string[] {
    const baseFormats = ['text', 'native'];
    
    // Allow more formats for popular repositories
    if (repository.stars > 500) {
      baseFormats.push('card');
    }
    
    if (repository.stars > 1000) {
      baseFormats.push('banner');
    }

    return baseFormats;
  }

  /**
   * Determine sections to exclude from ad placement
   */
  private determineExcludedSections(repository: RepositoryData): string[] {
    const excludeSections = ['license', 'contributing', 'changelog'];
    
    // Add repository-specific exclusions
    if (repository.adPlacementCategories.includes('no-installation')) {
      excludeSections.push('installation', 'setup', 'getting started');
    }

    return excludeSections;
  }

  /**
   * Get placement analytics
   */
  async getPlacementAnalytics(repositoryId: string, timeRange: {
    start: Date;
    end: Date;
  }): Promise<{
    totalImpressions: number;
    totalClicks: number;
    averageCTR: number;
    revenue: number;
    topPerformingFormats: Array<{ format: string; ctr: number }>;
    topPerformingSections: Array<{ section: string; ctr: number }>;
  }> {
    // TODO: Implement analytics aggregation
    // This would query the database for performance metrics
    
    console.log(`Getting analytics for repository ${repositoryId} from ${timeRange.start} to ${timeRange.end}`);
    
    return {
      totalImpressions: 5420,
      totalClicks: 284,
      averageCTR: 0.052,
      revenue: 142.50,
      topPerformingFormats: [
        { format: 'native', ctr: 0.061 },
        { format: 'text', ctr: 0.048 },
        { format: 'card', ctr: 0.043 },
        { format: 'banner', ctr: 0.039 }
      ],
      topPerformingSections: [
        { section: 'After introduction', ctr: 0.067 },
        { section: 'Before installation', ctr: 0.055 },
        { section: 'Between sections', ctr: 0.041 }
      ]
    };
  }
} 