export interface AdPlacement {
  id: string
  repositoryId: string
  location: string
  content: string
  type: 'banner' | 'inline' | 'sidebar'
  status: 'active' | 'paused' | 'draft'
  performance?: {
    views: number
    clicks: number
    conversions: number
    revenue: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface AdPlacementCreateInput {
  repositoryId: string
  location: string
  content: string
  type: 'banner' | 'inline' | 'sidebar'
}

export interface AdPlacementUpdateInput {
  location?: string
  content?: string
  type?: 'banner' | 'inline' | 'sidebar'
  status?: 'active' | 'paused' | 'draft'
}

export interface AdAnalysis {
  repositoryId: string
  suggestedPlacements: {
    location: string
    type: 'banner' | 'inline' | 'sidebar'
    confidence: number
    reasoning: string
  }[]
  technologiesDetected: string[]
  contentAnalysis: {
    topics: string[]
    sentiment: 'positive' | 'neutral' | 'negative'
    readability: number
  }
} 