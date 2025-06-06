'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';

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

// Global cache to prevent multiple simultaneous user creation requests
const userCreationCache = new Map<string, Promise<DatabaseUser>>();

export function useUserData() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    async function fetchUserData() {
      if (!clerkLoaded || !clerkUser) {
        setIsLoading(false);
        return;
      }

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        setIsLoading(true);
        setError(null);

        // Check if there's already a user creation in progress for this user
        const existingCreationPromise = userCreationCache.get(clerkUser.id);
        if (existingCreationPromise) {
          console.log('User creation already in progress, waiting...');
          const userData = await existingCreationPromise;
          if (!signal.aborted) {
            setDbUser(userData);
          }
          return;
        }

        // First try to get existing user from database
        const response = await fetch('/api/users', {
          signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (signal.aborted) return;

        if (response.ok) {
          const userData = await response.json();
          if (userData && !signal.aborted) {
            setDbUser(userData);
            retryCountRef.current = 0; // Reset retry count on success
            return;
          }
        }

        // If user doesn't exist in database, create them
        if (response.status === 401 || !response.ok) {
          // Create a promise for user creation and cache it to prevent race conditions
          const userCreationPromise = createUserWithRetry(clerkUser, signal);
          userCreationCache.set(clerkUser.id, userCreationPromise);

          try {
            const newUser = await userCreationPromise;
            if (!signal.aborted) {
              setDbUser(newUser);
              retryCountRef.current = 0; // Reset retry count on success
            }
          } finally {
            // Remove from cache after completion (success or failure)
            userCreationCache.delete(clerkUser.id);
          }
        }
      } catch (err) {
        if (signal.aborted) return;
        
        console.error('Error fetching user data:', err);
        
        // Implement exponential backoff for retries
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s
          
          console.log(`Retrying user data fetch in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
          
          setTimeout(() => {
            if (!signal.aborted) {
              fetchUserData();
            }
          }, delay);
          
          return;
        }
        
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchUserData();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
    
    // Retry function
    retry: () => {
      retryCountRef.current = 0;
      setError(null);
      // Trigger re-fetch by updating a dependency
      if (clerkUser) {
        fetchUserData();
      }
    },
    
    // Convenience getters for commonly used data
    displayName: clerkUser?.fullName || clerkUser?.firstName || dbUser?.name || 'User',
    email: clerkUser?.emailAddresses[0]?.emailAddress || dbUser?.email,
    avatarUrl: clerkUser?.imageUrl || dbUser?.avatar_url,
    plan: dbUser?.plan || 'free',
    githubUsername: dbUser?.github_username,
    createdAt: dbUser?.created_at,
  };
}

// Helper function to create user with retry logic
async function createUserWithRetry(
  clerkUser: {
    id: string;
    emailAddresses: Array<{ emailAddress: string }>;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  },
  signal: AbortSignal,
  retryCount = 0
): Promise<DatabaseUser> {
  const maxRetries = 3;
  
  try {
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
      signal,
    });

    if (signal.aborted) {
      throw new Error('Request aborted');
    }

    if (createResponse.ok) {
      const newUser = await createResponse.json();
      return newUser;
    }

    // If we get a 409 (conflict), the user might have been created by another request
    if (createResponse.status === 409) {
      // Try to fetch the existing user
      const fetchResponse = await fetch('/api/users', { signal });
      if (fetchResponse.ok) {
        const existingUser = await fetchResponse.json();
        if (existingUser) {
          return existingUser;
        }
      }
    }

    throw new Error(`Failed to create user: ${createResponse.status} ${createResponse.statusText}`);
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }

    // Retry with exponential backoff
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount + 1) * 1000; // 2s, 4s, 8s
      console.log(`Retrying user creation in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (signal.aborted) {
        throw new Error('Request aborted');
      }
      
      return createUserWithRetry(clerkUser, signal, retryCount + 1);
    }

    throw error;
  }
} 