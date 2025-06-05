# Intelligent Ad Placement System

## Overview

The Intelligent Ad Placement System is a comprehensive ML-powered solution that analyzes repository content to generate contextually relevant, non-intrusive ad placements with A/B testing capabilities. This system is the core innovation behind monetizeG's advanced advertising platform.

## 🧠 Core Components

### 1. Content Analysis Service (`src/lib/content-analysis.ts`)

**Purpose**: Analyzes README content using natural language processing and machine learning to extract meaningful insights.

**Key Features**:
- **Technology Detection**: Identifies programming languages, frameworks, and tools
- **Topic Classification**: Categorizes content into relevant topics (web-dev, mobile, AI, etc.)
- **Sentiment Analysis**: Measures content positivity and tone
- **Complexity Assessment**: Evaluates technical complexity level
- **Target Audience Identification**: Determines if content targets beginners, advanced developers, or researchers
- **Structure Parsing**: Analyzes markdown structure for optimal placement positions

**Technologies Used**:
- Natural Language Toolkit for tokenization and stemming
- Sentiment analysis library for emotional tone detection
- Markdown parsing for structure analysis
- Custom keyword databases for technology detection

### 2. Ad Placement Engine (`src/lib/ad-placement-engine.ts`)

**Purpose**: Generates optimal ad placements by matching ads to content based on ML analysis results.

**Key Features**:
- **Contextual Matching**: Scores ads against content using multiple factors
- **Technology Alignment**: Matches ads to detected technology stack
- **Topic Relevance**: Ensures ads are relevant to content topics
- **Audience Targeting**: Considers target audience compatibility
- **Performance History**: Incorporates historical CTR data
- **Format Selection**: Chooses appropriate ad formats (banner, text, card, native)
- **Non-Intrusive Placement**: Avoids code blocks and maintains readability

**Scoring Algorithm**:
```
Final Score = (Technology Alignment × 40%) + 
              (Topic Relevance × 30%) + 
              (Audience Fit × 20%) + 
              (Performance History × 10%)
```

### 3. A/B Testing Framework (`src/lib/ab-testing-framework.ts`)

**Purpose**: Manages experiments to optimize ad placement strategies through statistical testing.

**Key Features**:
- **Variant Management**: Creates and manages test variants
- **Traffic Splitting**: Deterministic user assignment to variants
- **Statistical Testing**: Z-tests for conversion rate comparisons
- **Early Termination**: Automatic stopping for significant results
- **Effect Size Calculation**: Measures practical significance
- **Confidence Intervals**: Provides uncertainty ranges

**Statistical Methods**:
- Z-test for proportion comparisons
- 95% confidence level by default
- Cohen's h for effect size measurement
- Early stopping for strong signals

### 4. Intelligent Ad Service (`src/lib/intelligent-ad-service.ts`)

**Purpose**: Main orchestrator that coordinates all components to provide complete intelligent placement functionality.

**Workflow**:
1. Content analysis and caching
2. Ad matching and scoring
3. Placement optimization
4. A/B test setup (if enabled)
5. README modification generation
6. Performance tracking

## 🚀 API Endpoints

### Content Analysis
```http
POST /api/intelligent-ads/analyze
Content-Type: application/json

{
  "repositoryId": "repo_id",
  "readmeContent": "# My Project\n..."
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "technologies": {
      "languages": [{"name": "javascript", "confidence": 0.95}],
      "frameworks": [{"name": "react", "confidence": 0.87}],
      "tools": [{"name": "webpack", "confidence": 0.73}]
    },
    "topics": [{"name": "web-development", "confidence": 0.91}],
    "targetAudience": "general-developers",
    "sentimentScore": 0.72,
    "complexityScore": 0.45,
    "optimalPlacements": [
      {
        "position": 15,
        "section": "After introduction",
        "score": 0.9,
        "reasoning": "High visibility and context setting"
      }
    ]
  }
}
```

### Generate Placements
```http
POST /api/intelligent-ads/generate-placements
Content-Type: application/json

{
  "repositoryId": "repo_id",
  "enableABTesting": true,
  "abTestConfig": {
    "name": "Placement Test",
    "testType": "placement",
    "variants": [
      {"name": "Control", "config": {}},
      {"name": "Multiple", "config": {}}
    ],
    "trafficSplit": {"variant_1": 50, "variant_2": 50}
  }
}
```

## 📊 Database Schema

### Core Tables

**content_analysis**: Stores ML analysis results
- `repository_id`: Foreign key to repositories
- `technologies`: JSON array of detected technologies
- `topics`: JSON array of classified topics
- `optimal_placements`: JSON array of suggested positions
- `sentiment_score`, `complexity_score`: Numerical metrics

**ad_placements**: Active ad placement instances
- `repository_id`, `campaign_id`, `ad_creative_id`: Relationships
- `position`: Line number in README
- `section`: Section name where placed
- `ab_test_id`: Optional A/B test association

**ab_tests**: A/B test configurations
- `test_type`: placement, creative, or format
- `variants`: JSON configuration for test variants
- `traffic_split`: Percentage allocation per variant
- `status`: draft, running, completed, paused

**ab_test_results**: Event tracking for tests
- `ab_test_id`, `variant`: Test and variant identification
- `event_type`: impression, click, conversion
- `value`: Optional monetary value
- `metadata`: Additional event context

## 🎯 Ad Formats

### 1. Banner Ads
```html
<div align="center" style="margin: 20px 0; padding: 15px; border: 1px solid #e1e5e9; border-radius: 8px;">
  <h4>Sponsored Content</h4>
  <p>Your ad description here</p>
  <a href="https://example.com">Learn More</a>
  <p style="font-size: 11px; color: #999;">Advertisement</p>
</div>
```

### 2. Native Ads
```markdown
### 🔧 Related Tool

A description that blends naturally with the content.

[![Check it out](https://img.shields.io/badge/-Check%20it%20out-blue?style=flat-square)](https://example.com)

*Sponsored content*
```

### 3. Text Ads
```markdown
> **Sponsored Content** | Description here [Learn More](https://example.com) *(Advertisement)*
```

### 4. Card Ads
```html
<table style="margin: 20px 0; border: 1px solid #e1e5e9;">
  <tr>
    <td><img src="image.jpg" alt="Ad" style="width: 120px;"></td>
    <td style="padding: 15px;">
      <h4>Ad Title</h4>
      <p>Description</p>
      <a href="https://example.com">Learn More →</a>
    </td>
  </tr>
</table>
```

## 🧪 A/B Testing Process

### 1. Test Creation
```typescript
const testConfig = {
  name: "Placement Strategy Test",
  repositoryId: "repo_123",
  campaignId: "campaign_456",
  testType: "placement",
  variants: [
    {
      id: "control",
      name: "Single Placement",
      config: { maxPlacements: 1 }
    },
    {
      id: "multiple",
      name: "Multiple Placements", 
      config: { maxPlacements: 3 }
    }
  ],
  trafficSplit: { control: 50, multiple: 50 },
  minSampleSize: 1000,
  confidenceLevel: 0.95
};
```

### 2. User Assignment
```typescript
// Deterministic assignment based on user ID hash
const variant = abTestFramework.assignVariant(
  testId, 
  userId, 
  trafficSplit
);
```

### 3. Event Tracking
```typescript
await abTestFramework.recordEvent({
  abTestId: "test_123",
  variant: "control",
  eventType: "impression",
  userId: "user_456",
  metadata: { section: "installation" }
});
```

### 4. Statistical Analysis
```typescript
const analysis = await abTestFramework.analyzeTest("test_123");
// Returns:
// - metrics per variant
// - statistical significance
// - confidence intervals
// - recommendations
```

## 📈 Performance Optimization

### Content Analysis Caching
- Results cached by content hash
- Invalidation on README changes
- Background processing for popular repositories

### Ad Matching Optimization
- Pre-computed technology-ad compatibility matrices
- Efficient filtering using database indexes
- Batch processing for multiple repositories

### A/B Test Efficiency
- Early termination for clear winners
- Sequential testing for multiple variants
- Bayesian stopping rules for efficiency

## 🔧 Configuration

### Environment Variables
```env
# Required for content analysis
OPENAI_API_KEY=your_openai_key  # Optional: For advanced NLP
DATABASE_URL=postgresql://...

# A/B Testing Configuration
AB_TEST_MIN_SAMPLE_SIZE=100
AB_TEST_CONFIDENCE_LEVEL=0.95
AB_TEST_MAX_DURATION_DAYS=30
```

### Repository Settings
```typescript
interface RepositoryConfig {
  adPlacementEnabled: boolean;
  adPlacementMaxAds: number;
  adPlacementPosition: 'auto' | 'manual';
  adPlacementCategories: string[];
  excludeSections: string[];
  allowedFormats: AdFormat[];
}
```

## 📊 Analytics & Metrics

### Content Analysis Metrics
- Technology detection accuracy
- Topic classification confidence
- Sentiment analysis distribution
- Complexity score ranges

### Placement Performance
- Click-through rates by format
- Revenue per mille (RPM)
- Position effectiveness
- Section performance

### A/B Test Results
- Conversion rate lifts
- Statistical significance rates
- Test duration averages
- Winner implementation rates

## 🚀 Getting Started

### 1. Setup Database
```bash
npx prisma migrate dev
npx prisma generate
```

### 2. Install Dependencies
```bash
npm install natural compromise sentiment markdown-it js-yaml simple-statistics
```

### 3. Initialize Services
```typescript
import { IntelligentAdService } from '@/lib/intelligent-ad-service';

const service = new IntelligentAdService();

// Analyze repository content
const analysis = await service.contentAnalyzer.analyzeContent(
  'repo_id',
  readmeContent
);

// Generate placements
const result = await service.generateIntelligentPlacements({
  repository: repositoryData,
  availableAds: ads,
  enableABTesting: true
});
```

### 4. Use UI Components
```tsx
import { IntelligentAdPlacement } from '@/components/IntelligentAdPlacement';

<IntelligentAdPlacement 
  repository={repository}
  readmeContent={readmeContent}
/>
```

## 🧩 Integration Points

### GitHub Integration
- Webhook processing for README changes
- Automatic reanalysis triggers
- Branch-specific placement testing

### Analytics Integration
- Google Analytics event tracking
- Custom metrics collection
- Performance dashboard updates

### Campaign Management
- Advertiser targeting interface
- Budget and bid management
- Creative asset management

## 🔍 Troubleshooting

### Common Issues

**Low placement confidence scores**:
- Check content quality and length
- Ensure technology keywords are present
- Verify ad inventory relevance

**A/B test not reaching significance**:
- Increase test duration
- Check traffic volume
- Review effect size expectations

**Poor ad-content matching**:
- Update technology keyword databases
- Refine topic classification rules
- Improve advertiser targeting

### Debug Tools

```typescript
// Content analysis debugging
const analysis = await service.analyzeContent(repoId, content);
console.log('Technologies:', analysis.technologies);
console.log('Optimal placements:', analysis.optimalPlacements);

// Placement scoring debugging
const context = { /* placement context */ };
const placements = await service.generatePlacements(context, ads);
placements.forEach(p => 
  console.log(`Position ${p.position}: ${p.score} - ${p.reasoning}`)
);
```

## 📚 Further Reading

- [Natural Language Processing in Ad Tech](docs/nlp-techniques.md)
- [Statistical A/B Testing Best Practices](docs/ab-testing-guide.md)
- [Content Analysis Algorithm Details](docs/content-analysis-deep-dive.md)
- [Ad Format Optimization Strategies](docs/ad-format-guide.md)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to the intelligent ad placement system.

## 📄 License

This system is part of monetizeG and is licensed under the MIT License. 