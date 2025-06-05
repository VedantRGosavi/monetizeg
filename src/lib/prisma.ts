import { PrismaClient } from '../../generated/prisma'
import { auth } from '@clerk/nextjs/server'

// Define custom error types for better error handling
export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'DatabaseError'
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized: User must be logged in') {
    super(message)
    this.name = 'AuthorizationError'
    Object.setPrototypeOf(this, AuthorizationError.prototype)
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

// Safe error logging that redacts sensitive information
function logError(error: unknown, context?: string): void {
  const isDev = process.env.NODE_ENV !== 'production'
  
  // Create a safe error object for logging
  const safeError = {
    name: error instanceof Error ? error.name : 'Unknown Error',
    message: error instanceof Error ? error.message : String(error),
    context: context || 'prisma',
    timestamp: new Date().toISOString(),
  }
  
  // In development, include more details
  if (isDev) {
    console.error(`[${safeError.context}] ${safeError.name}: ${safeError.message}`, error)
  } else {
    // In production, only log safe information without stack traces
    console.error(JSON.stringify(safeError))
  }
}

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
  // Only log queries in development, only log errors in production
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Helper function to get authenticated user context for database operations
export async function getPrismaWithAuth() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new AuthorizationError()
    }

    return { prisma, userId }
  } catch (error) {
    // Differentiate between auth errors and other errors
    if (error instanceof AuthorizationError) {
      throw error // Rethrow auth errors as-is
    }
    
    // Log other errors safely
    logError(error, 'getPrismaWithAuth')
    throw new DatabaseError('Authentication service unavailable')
  }
}

// Helper function to get user by Clerk ID (for initial setup without auth requirement)
export async function getUserByClerkId(clerkId: string) {
  try {
    if (!clerkId) {
      throw new ValidationError('User ID is required')
    }
    
    return await prisma.user.findUnique({
      where: { clerkId }
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    
    logError(error, 'getUserByClerkId')
    throw new DatabaseError('Failed to retrieve user information')
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
    logError(error, 'getCurrentUser')
    throw new DatabaseError('Failed to retrieve current user')
  }
}

// Graceful shutdown
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect()
  } catch (error) {
    logError(error, 'disconnectPrisma')
    // Don't throw here as this is typically called during shutdown
  }
}
