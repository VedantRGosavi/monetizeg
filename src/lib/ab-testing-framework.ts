import { PlacementRecommendation } from './ad-placement-engine';

export interface ABTestConfig {
  id: string;
  repositoryId: string;
  campaignId: string;
  name: string;
  description?: string;
  testType: 'placement' | 'creative' | 'format';
  status: 'draft' | 'running' | 'completed' | 'paused';
  
  // Test configuration
  variants: ABTestVariant[];
  trafficSplit: Record<string, number>; // variant -> percentage
  
  // Test period
  startDate: Date;
  endDate?: Date;
  
  // Statistical requirements
  minSampleSize: number;
  confidenceLevel: number;
  
  // Results
  winningVariant?: string;
  significance?: number;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  config: {
    placements?: PlacementRecommendation[];
    adCreativeIds?: string[];
    formats?: string[];
    customSettings?: Record<string, unknown>;
  };
}

export interface ABTestResult {
  id: string;
  abTestId: string;
  variant: string;
  userId?: string;
  eventType: 'impression' | 'click' | 'conversion';
  value?: number;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  timestamp: Date;
}

export interface ABTestMetrics {
  variant: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  revenue: number;
  averageValue: number;
}

export interface StatisticalTestResult {
  isSignificant: boolean;
  pValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  effectSize: number;
  recommendation: 'continue' | 'stop_winner' | 'stop_no_winner' | 'extend';
}

export class ABTestingFramework {
  private readonly MINIMUM_SAMPLE_SIZE = 100;
  private readonly DEFAULT_CONFIDENCE_LEVEL = 0.95;
  
  /**
   * Create a new A/B test
   */
  async createTest(config: Omit<ABTestConfig, 'id' | 'status'>): Promise<ABTestConfig> {
    // Validate configuration
    this.validateTestConfig(config);
    
    // Generate test ID
    const testId = this.generateTestId();
    
    // Normalize traffic split
    const normalizedTrafficSplit = this.normalizeTrafficSplit(config.trafficSplit);
    
    const test: ABTestConfig = {
      ...config,
      id: testId,
      status: 'draft',
      trafficSplit: normalizedTrafficSplit,
      minSampleSize: config.minSampleSize || this.MINIMUM_SAMPLE_SIZE,
      confidenceLevel: config.confidenceLevel || this.DEFAULT_CONFIDENCE_LEVEL
    };
    
    // TODO: Save to database
    console.log('Created A/B test:', test);
    
    return test;
  }
  
  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<void> {
    // TODO: Load test from database
    // Update status to 'running'
    // Set actual start date
    console.log('Started A/B test:', testId);
  }
  
  /**
   * Stop an A/B test
   */
  async stopTest(testId: string, reason: string): Promise<void> {
    // TODO: Load test from database
    // Update status to 'completed'
    // Set end date
    // Calculate final results
    console.log('Stopped A/B test:', testId, 'Reason:', reason);
  }
  
  /**
   * Assign variant to user/session
   */
  assignVariant(testId: string, userId: string, trafficSplit: Record<string, number>): string {
    // Create deterministic hash for consistent assignment
    const hash = this.hashUserForTest(userId, testId);
    
    // Convert hash to percentage (0-100)
    const percentage = hash % 100;
    
    // Assign based on traffic split
    let cumulative = 0;
    for (const [variant, split] of Object.entries(trafficSplit)) {
      cumulative += split;
      if (percentage < cumulative) {
        return variant;
      }
    }
    
    // Fallback to first variant
    return Object.keys(trafficSplit)[0];
  }
  
  /**
   * Record test event
   */
  async recordEvent(event: Omit<ABTestResult, 'id' | 'timestamp'>): Promise<void> {
    const result: ABTestResult = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    };
    
    // TODO: Save to database
    console.log('Recorded A/B test event:', result);
    
    // Check if test should be stopped automatically
    await this.checkForEarlyTermination(event.abTestId);
  }
  
  /**
   * Get test metrics for all variants
   */
  async getTestMetrics(testId: string): Promise<ABTestMetrics[]> {
    // TODO: Load events from database and calculate metrics
    // This is a mock implementation for testId: ${testId}
    console.log('Getting metrics for test:', testId);
    return [
      {
        variant: 'A',
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        ctr: 0.05,
        conversionRate: 0.005,
        revenue: 250,
        averageValue: 50
      },
      {
        variant: 'B',
        impressions: 950,
        clicks: 60,
        conversions: 8,
        ctr: 0.063,
        conversionRate: 0.0084,
        revenue: 400,
        averageValue: 50
      }
    ];
  }
  
  /**
   * Perform statistical analysis
   */
  async analyzeTest(testId: string): Promise<{
    metrics: ABTestMetrics[];
    comparison: Record<string, StatisticalTestResult>;
    recommendation: string;
  }> {
    const metrics = await this.getTestMetrics(testId);
    
    if (metrics.length < 2) {
      throw new Error('Need at least 2 variants for comparison');
    }
    
    const comparison: Record<string, StatisticalTestResult> = {};
    const baselineVariant = metrics[0];
    
    // Compare each variant against the baseline
    for (let i = 1; i < metrics.length; i++) {
      const variant = metrics[i];
      const comparisonKey = `${baselineVariant.variant}_vs_${variant.variant}`;
      
      comparison[comparisonKey] = this.performStatisticalTest(
        baselineVariant,
        variant,
        this.DEFAULT_CONFIDENCE_LEVEL
      );
    }
    
    // Generate overall recommendation
    const recommendation = this.generateRecommendation(metrics, comparison);
    
    return {
      metrics,
      comparison,
      recommendation
    };
  }
  
  /**
   * Check for early termination conditions
   */
  private async checkForEarlyTermination(testId: string): Promise<void> {
    try {
      const analysis = await this.analyzeTest(testId);
      
      // Check if any variant has clear statistical significance
      const hasSignificantResult = Object.values(analysis.comparison).some(
        result => result.isSignificant && result.pValue < 0.01
      );
      
      if (hasSignificantResult) {
        // Check if minimum runtime has passed (e.g., 7 days)
        // TODO: Load test config and check start date
        
        // If conditions are met, automatically stop the test
        await this.stopTest(testId, 'Early termination - significant result detected');
      }
    } catch (error) {
      console.error('Error checking for early termination:', error);
    }
  }
  
  /**
   * Perform statistical significance test
   */
  private performStatisticalTest(
    baseline: ABTestMetrics,
    variant: ABTestMetrics,
    confidenceLevel: number
  ): StatisticalTestResult {
    // Perform z-test for conversion rates
    const baselineRate = baseline.conversions / baseline.impressions;
    const variantRate = variant.conversions / variant.impressions;
    
    // Calculate pooled standard error
    const pooledRate = (baseline.conversions + variant.conversions) / 
                      (baseline.impressions + variant.impressions);
    
    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * 
      (1 / baseline.impressions + 1 / variant.impressions)
    );
    
    // Calculate z-score
    const zScore = (variantRate - baselineRate) / standardError;
    
    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    // Check significance
    const isSignificant = pValue < (1 - confidenceLevel);
    
    // Calculate confidence interval for difference
    const criticalValue = this.getZCriticalValue(confidenceLevel);
    const marginOfError = criticalValue * standardError;
    const difference = variantRate - baselineRate;
    
    const confidenceInterval = {
      lower: difference - marginOfError,
      upper: difference + marginOfError
    };
    
    // Calculate effect size (Cohen's h for proportions)
    const effectSize = 2 * (Math.asin(Math.sqrt(variantRate)) - Math.asin(Math.sqrt(baselineRate)));
    
    // Generate recommendation
    let recommendation: StatisticalTestResult['recommendation'] = 'continue';
    
    if (isSignificant) {
      if (variantRate > baselineRate) {
        recommendation = 'stop_winner';
      } else {
        recommendation = 'stop_no_winner';
      }
    } else if (baseline.impressions + variant.impressions > 10000) {
      // Large sample, but no significance - probably no real difference
      recommendation = 'stop_no_winner';
    }
    
    return {
      isSignificant,
      pValue,
      confidenceInterval,
      effectSize,
      recommendation
    };
  }
  
  /**
   * Generate overall test recommendation
   */
  private generateRecommendation(
    metrics: ABTestMetrics[],
    comparison: Record<string, StatisticalTestResult>
  ): string {
    const significantResults = Object.values(comparison).filter(r => r.isSignificant);
    
    if (significantResults.length === 0) {
      const totalSamples = metrics.reduce((sum, m) => sum + m.impressions, 0);
      
      if (totalSamples < this.MINIMUM_SAMPLE_SIZE * metrics.length) {
        return 'Continue test - insufficient sample size for reliable results';
      } else {
        return 'No significant difference detected - consider stopping test';
      }
    }
    
    // Find the best performing variant
    const bestVariant = metrics.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
    
    const hasSignificantWinner = Object.values(comparison).some(
      result => result.isSignificant && result.effectSize > 0.1
    );
    
    if (hasSignificantWinner) {
      return `Implement variant ${bestVariant.variant} - statistically significant improvement detected`;
    } else {
      return 'Results are significant but effect size is small - consider business impact';
    }
  }
  
  /**
   * Validate test configuration
   */
  private validateTestConfig(config: Omit<ABTestConfig, 'id' | 'status'>): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Test name is required');
    }
    
    if (!config.variants || config.variants.length < 2) {
      throw new Error('At least 2 variants are required');
    }
    
    if (!config.trafficSplit || Object.keys(config.trafficSplit).length === 0) {
      throw new Error('Traffic split configuration is required');
    }
    
    // Validate that all variants have traffic allocation
    const variantIds = config.variants.map(v => v.id);
    const trafficSplitVariants = Object.keys(config.trafficSplit);
    
    for (const variantId of variantIds) {
      if (!trafficSplitVariants.includes(variantId)) {
        throw new Error(`Missing traffic allocation for variant: ${variantId}`);
      }
    }
    
    // Validate traffic split sums to 100%
    const totalTraffic = Object.values(config.trafficSplit).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalTraffic - 100) > 0.1) {
      throw new Error('Traffic split must sum to 100%');
    }
  }
  
  /**
   * Normalize traffic split to ensure it sums to 100%
   */
  private normalizeTrafficSplit(trafficSplit: Record<string, number>): Record<string, number> {
    const total = Object.values(trafficSplit).reduce((sum, val) => sum + val, 0);
    
    if (total === 0) {
      throw new Error('Traffic split cannot be all zeros');
    }
    
    const normalized: Record<string, number> = {};
    for (const [variant, value] of Object.entries(trafficSplit)) {
      normalized[variant] = (value / total) * 100;
    }
    
    return normalized;
  }
  
  /**
   * Generate deterministic hash for user-test combination
   */
  private hashUserForTest(userId: string, testId: string): number {
    const input = `${userId}-${testId}`;
    let hash = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }
  
  /**
   * Generate unique test ID
   */
  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    // Approximation using erf function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }
  
  /**
   * Error function approximation
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }
  
  /**
   * Get critical value for z-test
   */
  private getZCriticalValue(confidenceLevel: number): number {
    // Common critical values
    const criticalValues: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    
    return criticalValues[confidenceLevel] || 1.96;
  }
} 