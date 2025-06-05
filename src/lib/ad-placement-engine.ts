import { ContentAnalysisResult } from './content-analysis';

export interface AdCreative {
  id: string;
  campaignId: string;
  name: string;
  format: 'banner' | 'text' | 'card' | 'native';
  content: {
    title?: string;
    description?: string;
    imageUrl?: string;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
  };
  ctaText?: string;
  ctaUrl: string;
  targeting: {
    languages?: string[];
    topics?: string[];
    audienceTypes?: string[];
    minStars?: number;
    maxStars?: number;
  };
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
}

export interface PlacementRecommendation {
  adCreativeId: string;
  position: number;
  section: string;
  score: number;
  reasoning: string;
  format: string;
  renderedContent: string;
}

export interface PlacementContext {
  repositoryId: string;
  repositoryStars: number;
  repositoryLanguage: string;
  contentAnalysis: ContentAnalysisResult;
  maxAds: number;
  allowedFormats: string[];
  excludeSections: string[];
}

export class AdPlacementEngine {
  /**
   * Generate optimal ad placements for a repository
   */
  async generatePlacements(
    context: PlacementContext,
    availableAds: AdCreative[]
  ): Promise<PlacementRecommendation[]> {
    // Filter ads based on targeting criteria
    const targetedAds = this.filterAdsByTargeting(availableAds, context);
    
    // Score ads against content analysis
    const scoredAds = this.scoreAdsForContent(targetedAds, context.contentAnalysis);
    
    // Generate placement recommendations
    const placements = this.generatePlacementRecommendations(
      scoredAds,
      context
    );
    
    // Apply placement constraints and optimization
    return this.optimizePlacements(placements, context);
  }
  
  /**
   * Filter ads based on targeting criteria
   */
  private filterAdsByTargeting(
    ads: AdCreative[],
    context: PlacementContext
  ): AdCreative[] {
    return ads.filter(ad => {
      const { targeting } = ad;
      const { repositoryStars, repositoryLanguage, contentAnalysis } = context;
      
      // Check star requirements
      if (targeting.minStars && repositoryStars < targeting.minStars) {
        return false;
      }
      if (targeting.maxStars && repositoryStars > targeting.maxStars) {
        return false;
      }
      
      // Check language targeting
      if (targeting.languages && targeting.languages.length > 0) {
        const hasLanguageMatch = targeting.languages.some(lang =>
          lang.toLowerCase() === repositoryLanguage?.toLowerCase() ||
          contentAnalysis.technologies.languages.some(detectedLang =>
            detectedLang.name.toLowerCase() === lang.toLowerCase()
          )
        );
        if (!hasLanguageMatch) return false;
      }
      
      // Check topic targeting
      if (targeting.topics && targeting.topics.length > 0) {
        const hasTopicMatch = targeting.topics.some(topic =>
          contentAnalysis.topics.some(detectedTopic =>
            detectedTopic.name.toLowerCase().includes(topic.toLowerCase())
          )
        );
        if (!hasTopicMatch) return false;
      }
      
      // Check audience targeting
      if (targeting.audienceTypes && targeting.audienceTypes.length > 0) {
        const hasAudienceMatch = targeting.audienceTypes.includes(
          contentAnalysis.targetAudience
        );
        if (!hasAudienceMatch) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Score ads for content relevance
   */
  private scoreAdsForContent(
    ads: AdCreative[],
    contentAnalysis: ContentAnalysisResult
  ): Array<AdCreative & { relevanceScore: number }> {
    return ads.map(ad => {
      let score = 0;
      
      // Technology alignment score (40% weight)
      const techScore = this.calculateTechnologyAlignment(ad, contentAnalysis);
      score += techScore * 0.4;
      
      // Topic relevance score (30% weight)
      const topicScore = this.calculateTopicRelevance(ad, contentAnalysis);
      score += topicScore * 0.3;
      
      // Audience fit score (20% weight)
      const audienceScore = this.calculateAudienceFit(ad, contentAnalysis);
      score += audienceScore * 0.2;
      
      // Performance history score (10% weight)
      const performanceScore = this.calculatePerformanceScore(ad);
      score += performanceScore * 0.1;
      
      return {
        ...ad,
        relevanceScore: Math.max(0, Math.min(1, score))
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  /**
   * Calculate technology alignment score
   */
  private calculateTechnologyAlignment(
    ad: AdCreative,
    contentAnalysis: ContentAnalysisResult
  ): number {
    const { targeting } = ad;
    const { technologies } = contentAnalysis;
    
    if (!targeting.languages || targeting.languages.length === 0) {
      return 0.5; // Neutral score for non-tech-specific ads
    }
    
    let alignmentScore = 0;
    let totalWeight = 0;
    
    // Check language alignment
    targeting.languages.forEach(targetLang => {
      const detectedLang = technologies.languages.find(lang =>
        lang.name.toLowerCase() === targetLang.toLowerCase()
      );
      
      if (detectedLang) {
        alignmentScore += detectedLang.confidence;
        totalWeight += 1;
      }
    });
    
    // Check framework alignment
    const frameworkAlignment = technologies.frameworks.reduce((acc, framework) => {
      const isRelevant = targeting.languages?.some(lang =>
        this.isFrameworkRelevantToLanguage(framework.name, lang)
      );
      return isRelevant ? acc + framework.confidence : acc;
    }, 0);
    
    alignmentScore += frameworkAlignment;
    totalWeight += technologies.frameworks.length;
    
    return totalWeight > 0 ? alignmentScore / totalWeight : 0;
  }
  
  /**
   * Calculate topic relevance score
   */
  private calculateTopicRelevance(
    ad: AdCreative,
    contentAnalysis: ContentAnalysisResult
  ): number {
    const { targeting } = ad;
    const { topics } = contentAnalysis;
    
    if (!targeting.topics || targeting.topics.length === 0) {
      return 0.5; // Neutral score for topic-agnostic ads
    }
    
    let relevanceScore = 0;
    let matches = 0;
    
    targeting.topics.forEach(targetTopic => {
      const detectedTopic = topics.find(topic =>
        topic.name.toLowerCase().includes(targetTopic.toLowerCase()) ||
        targetTopic.toLowerCase().includes(topic.name.toLowerCase())
      );
      
      if (detectedTopic) {
        relevanceScore += detectedTopic.confidence;
        matches++;
      }
    });
    
    return matches > 0 ? relevanceScore / matches : 0;
  }
  
  /**
   * Calculate audience fit score
   */
  private calculateAudienceFit(
    ad: AdCreative,
    contentAnalysis: ContentAnalysisResult
  ): number {
    const { targeting } = ad;
    const { targetAudience } = contentAnalysis;
    
    if (!targeting.audienceTypes || targeting.audienceTypes.length === 0) {
      return 0.5; // Neutral score for general ads
    }
    
    return targeting.audienceTypes.includes(targetAudience) ? 1.0 : 0.2;
  }
  
  /**
   * Calculate performance score based on historical data
   */
  private calculatePerformanceScore(ad: AdCreative): number {
    const { performance } = ad;
    
    if (performance.impressions === 0) {
      return 0.5; // Neutral score for new ads
    }
    
    // Normalize CTR to 0-1 scale (assume 5% is excellent)
    const normalizedCTR = Math.min(performance.ctr / 0.05, 1.0);
    
    // Consider volume (more impressions = more reliable data)
    const volumeWeight = Math.min(performance.impressions / 10000, 1.0);
    
    return (normalizedCTR * volumeWeight) + (0.5 * (1 - volumeWeight));
  }
  
  /**
   * Generate placement recommendations
   */
  private generatePlacementRecommendations(
    scoredAds: Array<AdCreative & { relevanceScore: number }>,
    context: PlacementContext
  ): PlacementRecommendation[] {
    const { contentAnalysis, allowedFormats } = context;
    const { optimalPlacements } = contentAnalysis;
    
    const recommendations: PlacementRecommendation[] = [];
    
    // Match top ads to optimal placement positions
    const topAds = scoredAds.slice(0, Math.min(scoredAds.length, context.maxAds * 2));
    
    optimalPlacements.forEach(placement => {
      topAds.forEach(ad => {
        if (!allowedFormats.includes(ad.format)) return;
        
        // Calculate combined score
        const combinedScore = (placement.score * 0.6) + (ad.relevanceScore * 0.4);
        
        // Generate rendered content
        const renderedContent = this.generateAdMarkdown(ad, placement.section);
        
        recommendations.push({
          adCreativeId: ad.id,
          position: placement.position,
          section: placement.section,
          score: combinedScore,
          reasoning: `${placement.reasoning} | Ad relevance: ${(ad.relevanceScore * 100).toFixed(1)}%`,
          format: ad.format,
          renderedContent
        });
      });
    });
    
    return recommendations.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Optimize placement recommendations
   */
  private optimizePlacements(
    placements: PlacementRecommendation[],
    context: PlacementContext
  ): PlacementRecommendation[] {
    const { maxAds, excludeSections } = context;
    
    // Filter out excluded sections
    let filtered = placements.filter(p =>
      !excludeSections.some(excluded =>
        p.section.toLowerCase().includes(excluded.toLowerCase())
      )
    );
    
    // Ensure minimum distance between ads
    filtered = this.ensureMinimumDistance(filtered, 10);
    
    // Select top placements up to maxAds
    const optimized = filtered.slice(0, maxAds);
    
    // Sort by position for final ordering
    return optimized.sort((a, b) => a.position - b.position);
  }
  
  /**
   * Ensure minimum distance between ad placements
   */
  private ensureMinimumDistance(
    placements: PlacementRecommendation[],
    minDistance: number
  ): PlacementRecommendation[] {
    const result: PlacementRecommendation[] = [];
    const sortedPlacements = placements.sort((a, b) => b.score - a.score);
    
    sortedPlacements.forEach(placement => {
      const hasConflict = result.some(existing =>
        Math.abs(existing.position - placement.position) < minDistance
      );
      
      if (!hasConflict) {
        result.push(placement);
      }
    });
    
    return result;
  }
  
  /**
   * Generate markdown for ad creative
   */
  private generateAdMarkdown(ad: AdCreative, section: string): string {
    const { format, content, ctaText, ctaUrl } = ad;
    
    switch (format) {
      case 'banner':
        return this.generateBannerMarkdown(content, ctaText, ctaUrl);
      
      case 'text':
        return this.generateTextMarkdown(content, ctaText, ctaUrl);
      
      case 'card':
        return this.generateCardMarkdown(content, ctaText, ctaUrl);
      
      case 'native':
        return this.generateNativeMarkdown(content, ctaText, ctaUrl, section);
      
      default:
        return this.generateTextMarkdown(content, ctaText, ctaUrl);
    }
  }
  
  /**
   * Generate banner ad markdown
   */
  private generateBannerMarkdown(
    content: AdCreative['content'],
    ctaText: string | undefined,
    ctaUrl: string
  ): string {
    const title = content.title || 'Sponsored';
    const description = content.description || '';
    const cta = ctaText || 'Learn More';
    
    return `
<div align="center" style="margin: 20px 0; padding: 15px; border: 1px solid ${content.borderColor || '#e1e5e9'}; border-radius: 8px; background-color: ${content.backgroundColor || '#f8f9fa'};">
  <h4 style="margin: 0 0 8px 0; color: ${content.textColor || '#333'};">
    <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
      ${title}
    </a>
  </h4>
  ${description ? `<p style="margin: 0 0 12px 0; color: ${content.textColor || '#666'}; font-size: 14px;">${description}</p>` : ''}
  <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" 
     style="display: inline-block; padding: 8px 16px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">
    ${cta}
  </a>
  <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">Advertisement</p>
</div>
`;
  }
  
  /**
   * Generate text ad markdown
   */
  private generateTextMarkdown(
    content: AdCreative['content'],
    ctaText: string | undefined,
    ctaUrl: string
  ): string {
    const title = content.title || 'Sponsored Content';
    const description = content.description || '';
    const cta = ctaText || 'Learn More';
    
    return `
> **${title}** | ${description} [${cta}](${ctaUrl}) *(Advertisement)*
`;
  }
  
  /**
   * Generate card ad markdown
   */
  private generateCardMarkdown(
    content: AdCreative['content'],
    ctaText: string | undefined,
    ctaUrl: string
  ): string {
    const title = content.title || 'Sponsored';
    const description = content.description || '';
    const cta = ctaText || 'Learn More';
    const imageUrl = content.imageUrl;
    
    return `
<table style="margin: 20px 0; border: 1px solid ${content.borderColor || '#e1e5e9'}; border-radius: 8px; overflow: hidden; background-color: ${content.backgroundColor || '#fff'};">
  <tr>
    ${imageUrl ? `<td style="width: 120px; vertical-align: top;"><img src="${imageUrl}" alt="${title}" style="width: 100%; height: 80px; object-fit: cover;"></td>` : ''}
    <td style="padding: 15px; vertical-align: top;">
      <h4 style="margin: 0 0 8px 0; color: ${content.textColor || '#333'};">
        <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
          ${title}
        </a>
      </h4>
      ${description ? `<p style="margin: 0 0 12px 0; color: ${content.textColor || '#666'}; font-size: 14px;">${description}</p>` : ''}
      <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" 
         style="color: #007bff; text-decoration: none; font-size: 14px; font-weight: 500;">
        ${cta} →
      </a>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">Advertisement</p>
    </td>
  </tr>
</table>
`;
  }
  
  /**
   * Generate native ad markdown that blends with content
   */
  private generateNativeMarkdown(
    content: AdCreative['content'],
    ctaText: string | undefined,
    ctaUrl: string,
    section: string
  ): string {
    const title = content.title || 'Related Resource';
    const description = content.description || '';
    const cta = ctaText || 'Check it out';
    
    // Native ads blend more naturally with README sections
    if (section.toLowerCase().includes('tool') || section.toLowerCase().includes('resource')) {
      return `
### 🔧 ${title}

${description}

[![${cta}](https://img.shields.io/badge/-${encodeURIComponent(cta)}-blue?style=flat-square)](${ctaUrl})

<sub>*Sponsored content*</sub>
`;
    }
    
    return `
---

**💡 ${title}** - ${description} [${cta}](${ctaUrl})

<sub>*Sponsored content*</sub>

---
`;
  }
  
  /**
   * Check if framework is relevant to language
   */
  private isFrameworkRelevantToLanguage(framework: string, language: string): boolean {
    const relevanceMap: Record<string, string[]> = {
      javascript: ['react', 'vue', 'angular', 'express', 'next', 'gatsby', 'svelte'],
      typescript: ['react', 'vue', 'angular', 'express', 'next', 'nest'],
      python: ['django', 'flask', 'fastapi', 'tensorflow', 'pytorch'],
      java: ['spring', 'hibernate'],
      csharp: ['asp.net', '.net'],
      php: ['laravel', 'symfony'],
      ruby: ['rails', 'sinatra'],
      go: ['gin', 'echo'],
      rust: ['tokio', 'serde']
    };
    
    const languageFrameworks = relevanceMap[language.toLowerCase()] || [];
    return languageFrameworks.some(fw => 
      framework.toLowerCase().includes(fw) || fw.includes(framework.toLowerCase())
    );
  }
} 