import { prisma, getPrismaWithAuth, getCurrentUser } from '../prisma'

export interface CreateRepositoryData {
  fullName: string
  description?: string
  stars?: number
  forks?: number
  language?: string
  isPrivate?: boolean
}

export interface UpdateRepositoryData {
  isMonetized?: boolean
  adPlacementEnabled?: boolean
  adPlacementMaxAds?: number
  adPlacementPosition?: string
  adPlacementCategories?: string[]
}

export class RepositoryService {
  // Create a new repository
  static async createRepository(data: CreateRepositoryData) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found in database. Please refresh the page and try again.')
    }

    // Check if repository already exists for this user
    const existingRepo = await authPrisma.repository.findFirst({
      where: {
        userId: user.id,
        fullName: data.fullName
      }
    })

    if (existingRepo) {
      throw new Error(`Repository ${data.fullName} is already connected`)
    }

    return await authPrisma.repository.create({
      data: {
        userId: user.id,
        fullName: data.fullName,
        description: data.description,
        stars: data.stars || 0,
        forks: data.forks || 0,
        language: data.language,
        isPrivate: data.isPrivate || false,
      },
      include: {
        user: true,
        contentAnalysis: true,
      }
    })
  }

  // Get all repositories for current user
  static async getRepositories() {
    const user = await getCurrentUser()
    
    if (!user) {
      return []
    }

    return await prisma.repository.findMany({
      where: {
        userId: user.id
      },
      include: {
        contentAnalysis: true,
        adPlacements: {
          include: {
            campaign: true,
            adCreative: true,
          }
        },
        repositoryMetrics: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Get a specific repository by ID
  static async getRepositoryById(id: string) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    return await authPrisma.repository.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        contentAnalysis: true,
        adPlacements: {
          include: {
            campaign: true,
            adCreative: true,
            abTest: true,
          }
        },
        repositoryMetrics: {
          orderBy: { date: 'desc' },
          take: 90 // Last 90 days
        },
        abTests: {
          include: {
            campaign: true,
            testResults: true,
          }
        }
      }
    })
  }

  // Update repository settings
  static async updateRepository(id: string, data: UpdateRepositoryData) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    // Verify repository belongs to user
    const repository = await authPrisma.repository.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!repository) {
      throw new Error('Repository not found or access denied')
    }

    return await authPrisma.repository.update({
      where: { id },
      data: {
        isMonetized: data.isMonetized,
        adPlacementEnabled: data.adPlacementEnabled,
        adPlacementMaxAds: data.adPlacementMaxAds,
        adPlacementPosition: data.adPlacementPosition,
        adPlacementCategories: data.adPlacementCategories,
        updatedAt: new Date(),
      },
      include: {
        contentAnalysis: true,
        adPlacements: true,
      }
    })
  }

  // Delete repository
  static async deleteRepository(id: string) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    // Verify repository belongs to user
    const repository = await authPrisma.repository.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!repository) {
      throw new Error('Repository not found or access denied')
    }

    // Prisma will handle cascade deletes based on schema relationships
    return await authPrisma.repository.delete({
      where: { id }
    })
  }

  // Get repository metrics
  static async getRepositoryMetrics(repositoryId: string, days: number = 30) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    // Verify repository belongs to user
    const repository = await authPrisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: user.id
      }
    })

    if (!repository) {
      throw new Error('Repository not found or access denied')
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return await authPrisma.repositoryMetric.findMany({
      where: {
        repositoryId,
        date: {
          gte: startDate
        }
      },
      orderBy: { date: 'asc' }
    })
  }

  // Update repository metrics
  static async updateRepositoryMetrics(repositoryId: string, data: {
    date: Date
    period?: string
    impressions?: number
    clicks?: number
    ctr?: number
    revenue?: number
    rpm?: number
  }) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    
    return await authPrisma.repositoryMetric.upsert({
      where: {
        repositoryId_date_period: {
          repositoryId,
          date: data.date,
          period: data.period || 'daily'
        }
      },
      update: {
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: data.ctr,
        revenue: data.revenue,
        rpm: data.rpm,
      },
      create: {
        repositoryId,
        date: data.date,
        period: data.period || 'daily',
        impressions: data.impressions || 0,
        clicks: data.clicks || 0,
        ctr: data.ctr || 0,
        revenue: data.revenue || 0,
        rpm: data.rpm || 0,
      }
    })
  }
} 