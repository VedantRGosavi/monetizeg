export interface Campaign {
  id: string
  name: string
  status: 'active' | 'paused' | 'completed'
  budget: number
  spent: number
  clicks: number
  impressions: number
  createdAt: Date
  updatedAt: Date
}

export interface CampaignCreateInput {
  name: string
  budget: number
  status?: 'active' | 'paused' | 'completed'
}

export interface CampaignUpdateInput {
  name?: string
  budget?: number
  status?: 'active' | 'paused' | 'completed'
} 