'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useEffect } from 'react';

export function useConvexUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const createUser = useMutation(api.users.createUser);
  
  const user = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && clerkUser && !user) {
      // Create user in Convex if they don't exist
      createUser({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || '',
        avatarUrl: clerkUser.imageUrl || '',
      });
    }
  }, [isLoaded, clerkUser, user, createUser]);

  return {
    user,
    isLoading: !isLoaded || (clerkUser && user === undefined),
  };
}

