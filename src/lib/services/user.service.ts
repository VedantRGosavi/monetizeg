import { prisma, getPrismaWithAuth, getCurrentUser } from '../prisma'
import type { User } from '../../../generated/prisma'
import { decrypt } from '../crypto'
import { Octokit } from '@octokit/rest'

export interface CreateUserData {
  id: string
  emailAddresses: Array<{ emailAddress: string }>
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string
}

export class UserService {
  // Create or update user (for initial setup without auth requirement)
  static async createOrUpdateInitialUser(clerkUser: CreateUserData): Promise<User> {
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      throw new Error('User email is required')
    }

    const name = clerkUser.firstName && clerkUser.lastName 
      ? `${clerkUser.firstName} ${clerkUser.lastName}` 
      : clerkUser.firstName || clerkUser.lastName || null

    return await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email,
        name,
        avatarUrl: clerkUser.imageUrl || null,
        updatedAt: new Date(),
      },
      create: {
        clerkId: clerkUser.id,
        email,
        name,
        avatarUrl: clerkUser.imageUrl || null,
      },
    })
  }

  // Create or update user with authentication required
  static async createOrUpdateUser(clerkUser: CreateUserData): Promise<User> {
    // Get auth context - will throw if unauthorized
    const { prisma: authPrisma, userId } = await getPrismaWithAuth()
    
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      throw new Error('User email is required')
    }

    const name = clerkUser.firstName && clerkUser.lastName 
      ? `${clerkUser.firstName} ${clerkUser.lastName}` 
      : clerkUser.firstName || clerkUser.lastName || null

    return await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email,
        name,
        avatarUrl: clerkUser.imageUrl || null,
        updatedAt: new Date(),
      },
      create: {
        clerkId: clerkUser.id,
        email,
        name,
        avatarUrl: clerkUser.imageUrl || null,
      },
    })
  }

  // Get current authenticated user
  static async getCurrentUser(): Promise<User | null> {
    return await getCurrentUser()
  }

  // Get user by Clerk ID
  static async getUserByClerkId(clerkId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { clerkId }
      })
    } catch (error) {
      console.error('Error getting user by Clerk ID:', error)
      return null
    }
  }

  // Get user with all relationships
  static async getUserWithRelations(clerkId: string) {
    try {
      return await prisma.user.findUnique({
        where: { clerkId },
        include: {
          repositories: {
            orderBy: { createdAt: 'desc' }
          },
          campaigns: {
            orderBy: { createdAt: 'desc' }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    } catch (error) {
      console.error('Error getting user with relations:', error)
      return null
    }
  }

  // Update user profile
  static async updateUser(data: Partial<Pick<User, 'name' | 'avatarUrl'>>) {
    const { prisma: authPrisma, userId } = await getPrismaWithAuth()
    
    return await authPrisma.user.update({
      where: { clerkId: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    })
  }

  // Delete user and all related data
  static async deleteUser() {
    const { prisma: authPrisma, userId } = await getPrismaWithAuth()
    
    // Prisma will handle cascade deletes based on schema relationships
    return await authPrisma.user.delete({
      where: { clerkId: userId }
    })
  }

  // Get GitHub token for authenticated user
  static async getGitHubToken(): Promise<string> {
    const { userId } = await getPrismaWithAuth()
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { githubAccessToken: true }
    })
    
    if (!user?.githubAccessToken) {
      throw new Error('GitHub token not found. Please connect your GitHub account.')
    }
    
    // Decrypt the token
    return decrypt(user.githubAccessToken)
  }
  
  // Validate GitHub token and return user info
  static async validateGitHubToken(token: string) {
    try {
      const octokit = new Octokit({ auth: token })
      const { data: githubUser } = await octokit.users.getAuthenticated()
      
      return {
        valid: true,
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        name: githubUser.name
      }
    } catch (error) {
      console.error('GitHub token validation error:', error)
      return { valid: false }
    }
  }
  
  // Create GitHub API client with authenticated user's token
  static async getGitHubClient(): Promise<Octokit> {
    const token = await this.getGitHubToken()
    return new Octokit({ auth: token })
  }
}
