'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

interface DatabaseUser {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
  github_username?: string;
  avatar_url?: string;
  plan: 'free' | 'pro' | 'enterprise';
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export function useUserData() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!clerkLoaded || !clerkUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // First try to get existing user from database
        const response = await fetch('/api/users');
        
        if (response.ok) {
          const userData = await response.json();
          if (userData) {
            setDbUser(userData);
            return;
          }
        }

        // If user doesn't exist in database, create them
        if (response.status === 401 || !response.ok) {
          const createResponse = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: clerkUser.id,
              emailAddresses: clerkUser.emailAddresses,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              imageUrl: clerkUser.imageUrl,
            }),
          });

          if (createResponse.ok) {
            const newUser = await createResponse.json();
            setDbUser(newUser);
          } else {
            throw new Error('Failed to create user in database');
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [clerkUser, clerkLoaded]);

  return {
    // Clerk user data (authentication)
    clerkUser,
    isSignedIn: !!clerkUser,
    
    // Database user data (app-specific)
    dbUser,
    
    // Combined loading state
    isLoading: !clerkLoaded || isLoading,
    
    // Error state
    error,
    
    // Convenience getters for commonly used data
    displayName: clerkUser?.fullName || clerkUser?.firstName || dbUser?.name || 'User',
    email: clerkUser?.emailAddresses[0]?.emailAddress || dbUser?.email,
    avatarUrl: clerkUser?.imageUrl || dbUser?.avatar_url,
    plan: dbUser?.plan || 'free',
    githubUsername: dbUser?.github_username,
    createdAt: dbUser?.created_at,
  };
} 