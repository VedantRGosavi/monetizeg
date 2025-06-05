export interface Repository {
  id: string
  name: string
  description: string | null
  url: string
  stars: number
  forks: number
  language: string | null
  isPrivate: boolean
  owner: {
    login: string
    avatarUrl: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface RepositoryStats {
  views: number
  uniqueVisitors: number
  clicks: number
  conversions: number
  revenue: number
}

export interface RepositoryWithStats extends Repository {
  stats: RepositoryStats
}

export interface RepositoryCreateInput {
  githubId: string
  name: string
  description?: string | null
  url: string
  isPrivate: boolean
  owner: {
    login: string
    avatarUrl: string
  }
} 