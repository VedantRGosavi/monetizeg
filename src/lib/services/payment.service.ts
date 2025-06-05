import { prisma, getPrismaWithAuth, getCurrentUser } from '../prisma'

export interface CreatePaymentData {
  amount: number
  currency?: string
  type: 'earning' | 'payout' | 'subscription'
  description?: string
  metadata?: Record<string, unknown>
  stripePaymentIntentId?: string
}

export class PaymentService {
  // Create a new payment record
  static async createPayment(data: CreatePaymentData) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    return await authPrisma.payment.create({
      data: {
        userId: user.id,
        amount: data.amount,
        currency: data.currency || 'USD',
        type: data.type,
        description: data.description,
        metadata: JSON.parse(JSON.stringify(data.metadata || {})),
        stripePaymentIntentId: data.stripePaymentIntentId,
      },
      include: {
        user: true,
      }
    })
  }

  // Get all payments for current user
  static async getPayments() {
    const user = await getCurrentUser()
    
    if (!user) {
      return []
    }

    return await prisma.payment.findMany({
      where: {
        userId: user.id
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Get payments by type
  static async getPaymentsByType(type: 'earning' | 'payout' | 'subscription') {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      return []
    }

    return await authPrisma.payment.findMany({
      where: {
        userId: user.id,
        type
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Get payment by ID
  static async getPaymentById(id: string) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    return await authPrisma.payment.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        user: true,
      }
    })
  }

  // Update payment status
  static async updatePaymentStatus(
    id: string, 
    status: 'pending' | 'completed' | 'failed' | 'cancelled', 
    processedAt?: Date
  ) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    // Verify payment belongs to user
    const payment = await authPrisma.payment.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!payment) {
      throw new Error('Payment not found or access denied')
    }

    return await authPrisma.payment.update({
      where: { id },
      data: {
        status,
        processedAt: processedAt || (status === 'completed' ? new Date() : null),
        updatedAt: new Date(),
      }
    })
  }

  // Get earnings summary
  static async getEarningsSummary() {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    // Get total earnings by status
    const earningsSummary = await authPrisma.payment.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        type: 'earning'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Get monthly earnings for the last 12 months
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlyEarnings = await authPrisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        userId: user.id,
        type: 'earning',
        status: 'completed',
        createdAt: {
          gte: twelveMonthsAgo
        }
      },
      _sum: {
        amount: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Process monthly data
    const monthlyData = monthlyEarnings.reduce((acc, earning) => {
      const month = earning.createdAt.toISOString().slice(0, 7) // YYYY-MM format
      if (!acc[month]) {
        acc[month] = 0
      }
      acc[month] += earning._sum.amount || 0
      return acc
    }, {} as Record<string, number>)

    return {
      summary: earningsSummary.reduce((acc, item) => {
        acc[item.status] = {
          amount: item._sum.amount || 0,
          count: item._count.id
        }
        return acc
      }, {} as Record<string, { amount: number; count: number }>),
      monthlyEarnings: monthlyData
    }
  }

  // Get payout history
  static async getPayoutHistory() {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    return await authPrisma.payment.findMany({
      where: {
        userId: user.id,
        type: 'payout'
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Create payout request
  static async createPayoutRequest(amount: number, description?: string) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    // Check available balance (completed earnings minus completed payouts)
    const earnings = await authPrisma.payment.aggregate({
      where: {
        userId: user.id,
        type: 'earning',
        status: 'completed'
      },
      _sum: {
        amount: true
      }
    })

    const payouts = await authPrisma.payment.aggregate({
      where: {
        userId: user.id,
        type: 'payout',
        status: 'completed'
      },
      _sum: {
        amount: true
      }
    })

    const availableBalance = (earnings._sum.amount || 0) - (payouts._sum.amount || 0)

    if (amount > availableBalance) {
      throw new Error('Insufficient balance for payout request')
    }

    return await authPrisma.payment.create({
      data: {
        userId: user.id,
        amount,
        currency: 'USD',
        type: 'payout',
        status: 'pending',
        description: description || 'Payout request'
      }
    })
  }

  // Get user balance
  static async getUserBalance() {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    const earnings = await authPrisma.payment.aggregate({
      where: {
        userId: user.id,
        type: 'earning',
        status: 'completed'
      },
      _sum: {
        amount: true
      }
    })

    const payouts = await authPrisma.payment.aggregate({
      where: {
        userId: user.id,
        type: 'payout',
        status: {
          in: ['completed', 'pending']
        }
      },
      _sum: {
        amount: true
      }
    })

    const pendingEarnings = await authPrisma.payment.aggregate({
      where: {
        userId: user.id,
        type: 'earning',
        status: 'pending'
      },
      _sum: {
        amount: true
      }
    })

    return {
      availableBalance: (earnings._sum.amount || 0) - (payouts._sum.amount || 0),
      pendingEarnings: pendingEarnings._sum.amount || 0,
      totalEarnings: earnings._sum.amount || 0,
      totalPayouts: payouts._sum.amount || 0
    }
  }

  // Record ad revenue
  static async recordAdRevenue(data: {
    repositoryId: string
    campaignId: string
    adPlacementId: string
    amount: number
    description?: string
  }) {
    const { prisma: authPrisma } = await getPrismaWithAuth()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User not found')
    }

    return await authPrisma.payment.create({
      data: {
        userId: user.id,
        amount: data.amount,
        currency: 'USD',
        type: 'earning',
        status: 'pending',
        description: data.description || `Ad revenue from ${data.repositoryId}`,
        metadata: {
          repositoryId: data.repositoryId,
          campaignId: data.campaignId,
          adPlacementId: data.adPlacementId
        }
      }
    })
  }
} 