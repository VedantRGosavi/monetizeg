import * as natural from 'natural';
import Sentiment from 'sentiment';
import * as crypto from 'crypto-js';

// Initialize NLP tools
const sentiment = new Sentiment();

// Technology keywords database
const TECH_KEYWORDS = {
  languages: {
    javascript: ['javascript', 'js', 'node', 'nodejs', 'npm', 'yarn', 'react', 'vue', 'angular', 'express'],
    python: ['python', 'pip', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'sklearn', 'tensorflow', 'pytorch'],
    java: ['java', 'spring', 'maven', 'gradle', 'hibernate', 'junit'],
    csharp: ['c#', 'csharp', '.net', 'dotnet', 'asp.net', 'nuget'],
    go: ['golang', 'go', 'gorilla', 'gin', 'echo'],
    rust: ['rust', 'cargo', 'tokio', 'serde'],
    typescript: ['typescript', 'ts', 'tsc'],
    php: ['php', 'composer', 'laravel', 'symfony', 'codeigniter'],
    ruby: ['ruby', 'rails', 'gem', 'bundler', 'sinatra'],
    swift: ['swift', 'ios', 'xcode', 'cocoapods'],
    kotlin: ['kotlin', 'android', 'gradle'],
    dart: ['dart', 'flutter', 'pub']
  },
  frameworks: {
    web: ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'gatsby', 'express', 'koa', 'fastify'],
    mobile: ['react-native', 'flutter', 'ionic', 'xamarin', 'cordova'],
    desktop: ['electron', 'tauri', 'qt', 'tkinter', 'javafx'],
    backend: ['django', 'flask', 'fastapi', 'spring', 'rails', 'laravel', 'express', 'nest'],
    ml: ['tensorflow', 'pytorch', 'scikit-learn', 'keras', 'opencv', 'pandas', 'numpy']
  },
  tools: {
    databases: ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'cassandra', 'elasticsearch'],
    cloud: ['aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify', 'docker', 'kubernetes'],
    testing: ['jest', 'mocha', 'chai', 'pytest', 'junit', 'cypress', 'selenium'],
    build: ['webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'babel', 'tsc']
  }
};

// Topic classification keywords
const TOPIC_KEYWORDS = {
  'web-development': ['website', 'web', 'frontend', 'backend', 'fullstack', 'spa', 'pwa', 'api', 'rest', 'graphql'],
  'mobile-development': ['mobile', 'ios', 'android', 'app', 'smartphone', 'tablet'],
  'data-science': ['data', 'analytics', 'machine learning', 'ai', 'ml', 'visualization', 'statistics'],
  'devops': ['devops', 'ci/cd', 'deployment', 'infrastructure', 'monitoring', 'logging'],
  'game-development': ['game', 'gaming', 'unity', 'unreal', 'gamedev', '2d', '3d'],
  'blockchain': ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'smart contract', 'defi', 'nft'],
  'iot': ['iot', 'internet of things', 'embedded', 'raspberry pi', 'arduino', 'sensor'],
  'cybersecurity': ['security', 'encryption', 'vulnerability', 'penetration testing', 'firewall'],
  'enterprise': ['enterprise', 'business', 'erp', 'crm', 'workflow', 'productivity'],
  'education': ['education', 'learning', 'tutorial', 'course', 'documentation', 'guide']
};

export interface ContentAnalysisResult {
  id: string;
  repositoryId: string;
  readmeContent: string;
  contentHash: string;
  
  // ML Analysis Results
  technologies: {
    languages: Array<{ name: string; confidence: number }>;
    frameworks: Array<{ name: string; confidence: number }>;
    tools: Array<{ name: string; confidence: number }>;
  };
  topics: Array<{ name: string; confidence: number }>;
  sentimentScore: number;
  complexityScore: number;
  targetAudience: string;
  
  // Content Structure Analysis
  sections: Array<{
    title: string;
    level: number;
    startLine: number;
    endLine: number;
    wordCount: number;
  }>;
  codeBlocks: Array<{
    language: string;
    startLine: number;
    endLine: number;
    lineCount: number;
  }>;
  optimalPlacements: Array<{
    position: number;
    section: string;
    score: number;
    reasoning: string;
  }>;
  
  // Processing metadata
  analysisVersion: string;
  processedAt: Date;
}

export class ContentAnalysisService {
  private tokenizer = new natural.WordTokenizer();
  private stemmer = natural.PorterStemmer;
  
  /**
   * Analyze repository README content
   */
  async analyzeContent(repositoryId: string, readmeContent: string): Promise<ContentAnalysisResult> {
    const contentHash = this.generateContentHash(readmeContent);
    
    // Parse markdown structure
    const sections = this.extractSections(readmeContent);
    const codeBlocks = this.extractCodeBlocks(readmeContent);
    
    // Perform ML analysis
    const technologies = this.detectTechnologies(readmeContent);
    const topics = this.classifyTopics(readmeContent);
    const sentimentScore = this.analyzeSentiment(readmeContent);
    const complexityScore = this.calculateComplexity(readmeContent);
    const targetAudience = this.determineTargetAudience(readmeContent, technologies, topics);
    
    // Find optimal ad placements
    const optimalPlacements = this.findOptimalPlacements(readmeContent, sections, codeBlocks);
    
    return {
      id: crypto.lib.WordArray.random(16).toString(),
      repositoryId,
      readmeContent,
      contentHash,
      technologies,
      topics,
      sentimentScore,
      complexityScore,
      targetAudience,
      sections,
      codeBlocks,
      optimalPlacements,
      analysisVersion: '1.0',
      processedAt: new Date()
    };
  }
  
  /**
   * Generate content hash for caching
   */
  private generateContentHash(content: string): string {
    return crypto.SHA256(content).toString();
  }
  
  /**
   * Extract sections from markdown content
   */
  private extractSections(content: string): Array<{
    title: string;
    level: number;
    startLine: number;
    endLine: number;
    wordCount: number;
  }> {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      
      if (headerMatch) {
        // Close previous section
        if (currentSection) {
          currentSection.endLine = i - 1;
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          title: headerMatch[2].trim(),
          level: headerMatch[1].length,
          startLine: i,
          endLine: lines.length - 1,
          wordCount: 0
        };
      }
    }
    
    // Close last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // Calculate word counts
    sections.forEach(section => {
      const sectionContent = lines
        .slice(section.startLine, section.endLine + 1)
        .join(' ');
      section.wordCount = this.tokenizer.tokenize(sectionContent)?.length || 0;
    });
    
    return sections;
  }
  
  /**
   * Extract code blocks from markdown
   */
  private extractCodeBlocks(content: string): Array<{
    language: string;
    startLine: number;
    endLine: number;
    lineCount: number;
  }> {
    const lines = content.split('\n');
    const codeBlocks = [];
    let inCodeBlock = false;
    let currentBlock = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          inCodeBlock = true;
          currentBlock = {
            language: line.substring(3).trim() || 'text',
            startLine: i,
            endLine: i,
            lineCount: 0
          };
        } else {
          // End of code block
          inCodeBlock = false;
          if (currentBlock) {
            currentBlock.endLine = i;
            currentBlock.lineCount = currentBlock.endLine - currentBlock.startLine + 1;
            codeBlocks.push(currentBlock);
          }
          currentBlock = null;
        }
      }
    }
    
    return codeBlocks;
  }
  
  /**
   * Detect technologies mentioned in content
   */
  private detectTechnologies(content: string): {
    languages: Array<{ name: string; confidence: number }>;
    frameworks: Array<{ name: string; confidence: number }>;
    tools: Array<{ name: string; confidence: number }>;
  } {
    const contentLower = content.toLowerCase();
    const tokens = this.tokenizer.tokenize(contentLower) || [];
    
    const detectInCategory = (keywords: Record<string, string[]>) => {
      const results: Array<{ name: string; confidence: number }> = [];
      
      Object.entries(keywords).forEach(([tech, techKeywords]) => {
        let matches = 0;
        let totalOccurrences = 0;
        
        techKeywords.forEach(keyword => {
          const occurrences = tokens.filter(token => 
            token.includes(keyword) || keyword.includes(token)
          ).length;
          
          if (occurrences > 0) {
            matches++;
            totalOccurrences += occurrences;
          }
        });
        
        if (matches > 0) {
          const confidence = Math.min(
            (matches / techKeywords.length) * 0.7 + 
            Math.min(totalOccurrences / tokens.length * 100, 0.3),
            1.0
          );
          
          results.push({ name: tech, confidence });
        }
      });
      
      return results
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Top 5 results
    };
    
    return {
      languages: detectInCategory(TECH_KEYWORDS.languages),
      frameworks: detectInCategory(TECH_KEYWORDS.frameworks),
      tools: detectInCategory(TECH_KEYWORDS.tools)
    };
  }
  
  /**
   * Classify content topics
   */
  private classifyTopics(content: string): Array<{ name: string; confidence: number }> {
    const contentLower = content.toLowerCase();
    const tokens = this.tokenizer.tokenize(contentLower) || [];
    const results: Array<{ name: string; confidence: number }> = [];
    
    Object.entries(TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
      let matches = 0;
      let totalOccurrences = 0;
      
      keywords.forEach(keyword => {
        if (contentLower.includes(keyword)) {
          matches++;
          // Count occurrences
          const regex = new RegExp(keyword, 'gi');
          const occurrences = (contentLower.match(regex) || []).length;
          totalOccurrences += occurrences;
        }
      });
      
      if (matches > 0) {
        const confidence = Math.min(
          (matches / keywords.length) * 0.8 + 
          Math.min(totalOccurrences / tokens.length * 50, 0.2),
          1.0
        );
        
        results.push({ name: topic, confidence });
      }
    });
    
    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3 topics
  }
  
  /**
   * Analyze sentiment of content
   */
  private analyzeSentiment(content: string): number {
    const result = sentiment.analyze(content);
    // Normalize to 0-1 scale (0 = negative, 0.5 = neutral, 1 = positive)
    return Math.max(0, Math.min(1, (result.score / 10) + 0.5));
  }
  
  /**
   * Calculate content complexity score
   */
  private calculateComplexity(content: string): number {
    const tokens = this.tokenizer.tokenize(content) || [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Factors contributing to complexity
    const avgWordsPerSentence = tokens.length / sentences.length;
    const uniqueWords = new Set(tokens.map(t => t.toLowerCase())).size;
    const lexicalDiversity = uniqueWords / tokens.length;
    const codeBlockCount = (content.match(/```/g) || []).length / 2;
    
    // Normalize and combine factors
    const complexityScore = Math.min(1.0, 
      (avgWordsPerSentence / 20) * 0.3 +
      (1 - lexicalDiversity) * 0.3 +
      Math.min(codeBlockCount / 10, 1) * 0.4
    );
    
    return complexityScore;
  }
  
  /**
   * Determine target audience
   */
  private determineTargetAudience(
    content: string, 
    technologies: {
      languages: Array<{ name: string; confidence: number }>;
      frameworks: Array<{ name: string; confidence: number }>;
      tools: Array<{ name: string; confidence: number }>;
    }, 
    topics: Array<{ name: string; confidence: number }>
  ): string {
    const contentLower = content.toLowerCase();
    
    // Audience indicators
    const beginnerKeywords = ['beginner', 'tutorial', 'getting started', 'introduction', 'learn', 'basic'];
    const advancedKeywords = ['advanced', 'expert', 'professional', 'enterprise', 'production', 'architecture'];
    const researchKeywords = ['research', 'paper', 'algorithm', 'experiment', 'analysis', 'study'];
    
    let beginnerScore = 0;
    let advancedScore = 0;
    let researchScore = 0;
    
    beginnerKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) beginnerScore++;
    });
    
    advancedKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) advancedScore++;
    });
    
    researchKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) researchScore++;
    });
    
    // Determine primary audience
    if (researchScore > beginnerScore && researchScore > advancedScore) {
      return 'researchers';
    } else if (advancedScore > beginnerScore) {
      return 'advanced-developers';
    } else if (beginnerScore > 0 || topics.some(t => t.name === 'education')) {
      return 'beginners';
    } else {
      return 'general-developers';
    }
  }
  
  /**
   * Find optimal ad placement positions
   */
  private findOptimalPlacements(
    content: string,
    sections: Array<{
      title: string;
      level: number;
      startLine: number;
      endLine: number;
      wordCount: number;
    }>,
    codeBlocks: Array<{
      language: string;
      startLine: number;
      endLine: number;
      lineCount: number;
    }>
  ): Array<{
    position: number;
    section: string;
    score: number;
    reasoning: string;
  }> {
    const lines = content.split('\n');
    const placements = [];
    
    // Strategy 1: After introduction/overview section
    const introSection = sections.find(s => 
      s.title.toLowerCase().includes('introduction') ||
      s.title.toLowerCase().includes('overview') ||
      s.title.toLowerCase().includes('about') ||
      s.level === 1
    );
    
    if (introSection && introSection.wordCount > 50) {
      placements.push({
        position: introSection.endLine + 1,
        section: introSection.title,
        score: 0.9,
        reasoning: 'After introduction - high visibility and context setting'
      });
    }
    
    // Strategy 2: Before installation section
    const installSection = sections.find(s =>
      s.title.toLowerCase().includes('install') ||
      s.title.toLowerCase().includes('setup') ||
      s.title.toLowerCase().includes('getting started')
    );
    
    if (installSection) {
      placements.push({
        position: installSection.startLine - 1,
        section: installSection.title,
        score: 0.8,
        reasoning: 'Before installation - catches engaged users'
      });
    }
    
    // Strategy 3: Between major sections (avoid code blocks)
    for (let i = 1; i < sections.length; i++) {
      const prevSection = sections[i - 1];
      const currentSection = sections[i];
      
      // Check if there's enough space and no code blocks
      const hasCodeBlock = codeBlocks.some(cb =>
        cb.startLine >= prevSection.endLine &&
        cb.endLine <= currentSection.startLine
      );
      
      if (!hasCodeBlock && 
          currentSection.startLine - prevSection.endLine > 2 &&
          prevSection.wordCount > 30) {
        placements.push({
          position: prevSection.endLine + 2,
          section: `Between "${prevSection.title}" and "${currentSection.title}"`,
          score: 0.6,
          reasoning: 'Between sections - natural break point'
        });
      }
    }
    
    // Strategy 4: End of README (lower priority)
    if (lines.length > 100) {
      placements.push({
        position: lines.length - 5,
        section: 'End of README',
        score: 0.4,
        reasoning: 'End placement - for completionist readers'
      });
    }
    
    return placements
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 placements
  }
  
  /**
   * Check if content analysis needs update
   */
  async needsUpdate(repositoryId: string, currentContent: string): Promise<boolean> {
    try {
      // This would typically check against the database
      const contentHash = this.generateContentHash(currentContent);
      console.log('Checking update needed for repo:', repositoryId, 'hash:', contentHash);
      // For now, return true to always analyze
      return true;
    } catch (error) {
      console.error('Error checking if analysis needs update:', error);
      return true;
    }
  }
} 