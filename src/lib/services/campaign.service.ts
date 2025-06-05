import { prisma, getPrismaWithAuth, getCurrentUser } from '../prisma'

export interface CreateCampaignData {
  name: string
  description?: string
  budgetTotal: number
  budgetDailyLimit?: number
  startDate: string
  endDate?: string
  targetLanguages?: string[]
  targetTopics?: string[]
  targetAudienceTypes?: string[]
  minRepositoryStars?: number
  maxRepositoryStars?: number
}

export interface UpdateCampaignData {
  name?: string
  description?: string
  status?: 'draft' | 'active' | 'paused' | 'completed'
  budgetTotal?: number
  budgetDailyLimit?: number
  startDate?: string
  endDate?: string
  targetLanguages?: string[]
  targetTopics?: string[]
  targetAudienceTypes?: string[]
  minRepositoryStars?: number
  maxRepositoryStars?: number
}

export class CampaignService {
  // Create a new campaign
  static async createCampaign(data: CreateCampaignData) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    return await authPrisma.campaign.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description,
        budgetTotal: data.budgetTotal,
        budgetDailyLimit: data.budgetDailyLimit,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        targetLanguages: data.targetLanguages || [],
        targetTopics: data.targetTopics || [],
        targetAudienceTypes: data.targetAudienceTypes || [],
        minRepositoryStars: data.minRepositoryStars,
        maxRepositoryStars: data.maxRepositoryStars,
      },
      include: {
        user: true,
        adCreatives: true,
        adPlacements: true,
      }
    })
  }

  // Get all campaigns for current user
  static async getCampaigns() {
    const user = await getCurrentUser()
    
    if (!user) {
      return []
    }

    return await prisma.campaign.findMany({
      where: {
        userId: user.id
      },
      include: {
        adCreatives: {
          include: {
            adPlacements: true,
          }
        },
        adPlacements: {
          include: {
            repository: true,
            adCreative: true,
          }
        },
        abTests: {
          include: {
            testResults: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Get a specific campaign by ID
  static async getCampaignById(id: string) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    return await authPrisma.campaign.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        adCreatives: {
          include: {
            adPlacements: {
              include: {
                repository: true,
              }
            }
          }
        },
        adPlacements: {
          include: {
            repository: true,
            adCreative: true,
            abTest: true,
          }
        },
        abTests: {
          include: {
            repository: true,
            testResults: true,
          }
        }
      }
    })
  }

  // Update campaign
  static async updateCampaign(id: string, data: UpdateCampaignData) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    // Verify campaign belongs to user
    const campaign = await authPrisma.campaign.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!campaign) {
      throw new Error('Campaign not found or access denied')
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.budgetTotal !== undefined) updateData.budgetTotal = data.budgetTotal
    if (data.budgetDailyLimit !== undefined) updateData.budgetDailyLimit = data.budgetDailyLimit
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.targetLanguages !== undefined) updateData.targetLanguages = data.targetLanguages
    if (data.targetTopics !== undefined) updateData.targetTopics = data.targetTopics
    if (data.targetAudienceTypes !== undefined) updateData.targetAudienceTypes = data.targetAudienceTypes
    if (data.minRepositoryStars !== undefined) updateData.minRepositoryStars = data.minRepositoryStars
    if (data.maxRepositoryStars !== undefined) updateData.maxRepositoryStars = data.maxRepositoryStars

    return await authPrisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        adCreatives: true,
        adPlacements: true,
      }
    })
  }

  // Delete campaign
  static async deleteCampaign(id: string) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    // Verify campaign belongs to user
    const campaign = await authPrisma.campaign.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!campaign) {
      throw new Error('Campaign not found or access denied')
    }

    // Prisma will handle cascade deletes based on schema relationships
    return await authPrisma.campaign.delete({
      where: { id }
    })
  }

  // Get campaign performance metrics
  static async getCampaignMetrics(campaignId: string) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    // Verify campaign belongs to user
    const campaign = await authPrisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: user.id
      }
    })

    if (!campaign) {
      throw new Error('Campaign not found or access denied')
    }

    // Get aggregated metrics from ad placements
    const metrics = await authPrisma.adPlacement.aggregate({
      where: {
        campaignId,
      },
      _sum: {
        impressions: true,
        clicks: true,
        revenue: true,
      },
      _avg: {
        ctr: true,
      }
    })

    // Get performance over time
    const dailyMetrics = await authPrisma.adPlacement.groupBy({
      by: ['startDate'],
      where: {
        campaignId,
      },
      _sum: {
        impressions: true,
        clicks: true,
        revenue: true,
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    return {
      campaign,
      totalMetrics: {
        impressions: metrics._sum.impressions || 0,
        clicks: metrics._sum.clicks || 0,
        revenue: metrics._sum.revenue || 0,
        ctr: metrics._avg.ctr || 0,
        budgetUtilization: campaign.budgetSpent / campaign.budgetTotal,
      },
      dailyMetrics
    }
  }

  // Update campaign budget spent
  static async updateBudgetSpent(campaignId: string, amount: number) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    
    return await authPrisma.campaign.update({
      where: { id: campaignId },
      data: {
        budgetSpent: {
          increment: amount
        },
        updatedAt: new Date(),
      }
    })
  }

  // Get active campaigns with budget remaining
  static async getActiveCampaignsWithBudget() {
    const user = await getCurrentUser()
    
    if (!user) {
      return []
    }

    return await prisma.campaign.findMany({
      where: {
        userId: user.id,
        status: 'active',
        OR: [
          {
            budgetDailyLimit: null
          },
          {
            budgetSpent: {
              lt: prisma.campaign.fields.budgetTotal
            }
          }
        ]
      },
      include: {
        adCreatives: true,
        adPlacements: true,
      }
    })
  }
} 