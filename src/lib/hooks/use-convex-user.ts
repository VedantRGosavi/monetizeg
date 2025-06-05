'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  clerk_id: string;
  email: string;
  name?: string;
  github_username?: string;
  avatar_url?: string;
  plan: 'free' | 'pro' | 'enterprise';
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export function useConvexUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (!isLoaded || !clerkUser || hasInitialized) {
        if (!isLoaded || !clerkUser) {
          setIsLoading(false);
        }
        return;
      }

      try {
        // First, try to get existing user
        const getUserResponse = await fetch('/api/users');
        if (getUserResponse.ok) {
          const existingUser = await getUserResponse.json();
          if (existingUser) {
            setDbUser(existingUser);
            setHasInitialized(true);
            setIsLoading(false);
            return;
          }
        }

        // If user doesn't exist, create them
        const createUserResponse = await fetch('/api/users', {
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

        if (createUserResponse.ok) {
          const newUser = await createUserResponse.json();
          setDbUser(newUser);
        }
        
        setHasInitialized(true);
      } catch (error) {
        console.error('Error initializing user:', error);
        setHasInitialized(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [clerkUser, isLoaded, hasInitialized]);

  return {
    user: dbUser,
    isLoading: isLoading || !isLoaded,
  };
}

