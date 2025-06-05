import { PrismaClient } from '../../generated/prisma'
import { auth } from '@clerk/nextjs/server'

// Global type declaration for Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Create a single Prisma instance with proper Neon DB configuration
export const prisma = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Helper function to get authenticated user context for database operations
export async function getPrismaWithAuth() {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized: User must be logged in')
  }

  return { prisma, userId }
}

// Helper function to get user by Clerk ID (for initial setup without auth requirement)
export async function getUserByClerkId(clerkId: string) {
  try {
    return await prisma.user.findUnique({
      where: { clerkId }
    })
  } catch (error) {
    console.error('Error getting user by Clerk ID:', error)
    return null
  }
}

// Helper function to get current authenticated user
export async function getCurrentUser() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return null
    }

    return await prisma.user.findUnique({
      where: { clerkId: userId }
    })
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Graceful shutdown
export async function disconnectPrisma() {
  await prisma.$disconnect()
} 