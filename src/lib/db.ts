// NEW PRISMA-BASED DATABASE API
// This file replaces src/lib/db.ts with proper Prisma integration for Neon DB

import { UserService, type CreateUserData } from './services/user.service'
import { RepositoryService, type CreateRepositoryData, type UpdateRepositoryData } from './services/repository.service'
import { CampaignService, type CreateCampaignData, type UpdateCampaignData } from './services/campaign.service'
import { PaymentService, type CreatePaymentData } from './services/payment.service'

// Re-export all types for compatibility
export type { CreateUserData, CreateRepositoryData, UpdateRepositoryData, CreateCampaignData, UpdateCampaignData, CreatePaymentData }

// =======================
// USER OPERATIONS
// =======================

// Initial user creation (no auth required) - maintaining compatibility with existing API
export async function createInitialUser(clerkUser: CreateUserData) {
  return await UserService.createOrUpdateInitialUser(clerkUser)
}

// User management (requires auth) - maintaining compatibility with existing API
export async function createOrUpdateUser(clerkUser: CreateUserData) {
  return await UserService.createOrUpdateUser(clerkUser)
}

// Get current authenticated user
export async function getCurrentUser() {
  return await UserService.getCurrentUser()
}

// Get user by Clerk ID without auth requirement
export async function getUserByClerkId(clerkId: string) {
  return await UserService.getUserByClerkId(clerkId)
}

// =======================
// CAMPAIGN OPERATIONS
// =======================

// Create a new campaign - maintaining compatibility
export async function createCampaign(data: {
  name: string
  description?: string
  budgetTotal: number
  budgetDailyLimit?: number
  startDate: string
  endDate?: string
}) {
  return await CampaignService.createCampaign(data)
}

// Get all campaigns for current user
export async function getCampaigns() {
  return await CampaignService.getCampaigns()
}

// Update campaign - maintaining compatibility with existing API
export async function updateCampaign(id: string, data: Partial<{
  name: string
  description: string
  status: string
  budgetTotal: number
  budgetDailyLimit: number
  startDate: string
  endDate: string
}>) {
  return await CampaignService.updateCampaign(id, {
    name: data.name,
    description: data.description,
    status: data.status as 'draft' | 'active' | 'paused' | 'completed',
    budgetTotal: data.budgetTotal,
    budgetDailyLimit: data.budgetDailyLimit,
    startDate: data.startDate,
    endDate: data.endDate,
  })
}

// =======================
// REPOSITORY OPERATIONS
// =======================

// Create a repository - maintaining compatibility
export async function createRepository(data: {
  fullName: string
  description?: string
  stars?: number
  forks?: number
  language?: string
  isPrivate?: boolean
}) {
  return await RepositoryService.createRepository(data)
}

// Get all repositories for current user
export async function getRepositories() {
  return await RepositoryService.getRepositories()
}

// Update repository - maintaining compatibility with existing snake_case API
export async function updateRepository(id: string, data: Partial<{
  is_monetized: boolean
  ad_placement_enabled: boolean
  ad_placement_max_ads: number
  ad_placement_position: string
  ad_placement_categories: string[]
}>) {
  return await RepositoryService.updateRepository(id, {
    isMonetized: data.is_monetized,
    adPlacementEnabled: data.ad_placement_enabled,
    adPlacementMaxAds: data.ad_placement_max_ads,
    adPlacementPosition: data.ad_placement_position,
    adPlacementCategories: data.ad_placement_categories,
  })
}

// =======================
// PAYMENT OPERATIONS
// =======================

// Create a payment - maintaining compatibility
export async function createPayment(data: {
  amount: number
  currency?: string
  type: 'earning' | 'payout' | 'subscription'
  description?: string
  metadata?: Record<string, unknown>
  stripePaymentIntentId?: string
}) {
  return await PaymentService.createPayment(data)
}

// Get all payments for current user
export async function getPayments() {
  return await PaymentService.getPayments()
}

// Update payment status - maintaining compatibility
export async function updatePaymentStatus(
  id: string, 
  status: 'pending' | 'completed' | 'failed' | 'cancelled', 
  processedAt?: string
) {
  const processedDate = processedAt ? new Date(processedAt) : undefined
  return await PaymentService.updatePaymentStatus(id, status, processedDate)
}

// =======================
// ENHANCED OPERATIONS (New features with Prisma)
// =======================

// Enhanced user operations
export async function getUserWithRelations(clerkId: string) {
  return await UserService.getUserWithRelations(clerkId)
}

// Enhanced repository operations
export async function getRepositoryById(id: string) {
  return await RepositoryService.getRepositoryById(id)
}

export async function getRepositoryMetrics(repositoryId: string, days?: number) {
  return await RepositoryService.getRepositoryMetrics(repositoryId, days)
}

// Enhanced campaign operations
export async function getCampaignById(id: string) {
  return await CampaignService.getCampaignById(id)
}

export async function getCampaignMetrics(campaignId: string) {
  return await CampaignService.getCampaignMetrics(campaignId)
}

export async function getActiveCampaignsWithBudget() {
  return await CampaignService.getActiveCampaignsWithBudget()
}

// Enhanced payment operations
export async function getEarningsSummary() {
  return await PaymentService.getEarningsSummary()
}

export async function getUserBalance() {
  return await PaymentService.getUserBalance()
}

export async function createPayoutRequest(amount: number, description?: string) {
  return await PaymentService.createPayoutRequest(amount, description)
}

export async function recordAdRevenue(data: {
  repositoryId: string
  campaignId: string
  adPlacementId: string
  amount: number
  description?: string
}) {
  return await PaymentService.recordAdRevenue(data)
}

// =======================
// DATABASE HEALTH & UTILITIES
// =======================

// Database connection health check
export async function checkDatabaseHealth() {
  try {
    // Use a simple query to check Prisma connection to Neon DB
    await UserService.getCurrentUser()
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() }
  }
}

// Migration utilities for transitioning from old raw SQL
export async function validateDatabaseSchema() {
  try {
    // This would validate that all expected tables and relationships exist
    // For now, we'll do a basic check by attempting to query each main model
    await Promise.all([
      UserService.getCurrentUser(),
      RepositoryService.getRepositories(),
      CampaignService.getCampaigns(),
      PaymentService.getPayments(),
    ])
    return { valid: true, message: 'All database operations successful' }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// =======================
// DEPRECATED FUNCTIONS
// =======================

// Legacy function for backward compatibility - will be removed in future version
export async function getDbWithAuth() {
  console.warn('DEPRECATED: getDbWithAuth() is deprecated. Use the new service-based approach.')
  throw new Error('This function has been replaced with Prisma-based services. Please update your code to use the new UserService, RepositoryService, CampaignService, or PaymentService.')
} 