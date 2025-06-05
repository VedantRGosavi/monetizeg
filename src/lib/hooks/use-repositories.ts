'use client';

import { useState, useEffect } from 'react';

export interface Repository {
  id: string;
  full_name: string;
  description?: string;
  is_monetized: boolean;
  stars: number;
  forks: number;
  language?: string;
  is_private: boolean;
  ad_placement_enabled: boolean;
  ad_placement_max_ads: number;
  ad_placement_position: string;
  ad_placement_categories: string[];
  created_at: string;
  updated_at: string;
}

export function useRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/repositories');
      
      if (!response.ok) {
        // If it's a server error, set empty array and continue
        if (response.status >= 500) {
          console.warn('Server error fetching repositories, returning empty array');
          setRepositories([]);
          setError(null);
          return;
        }
        throw new Error('Failed to fetch repositories');
      }
      
      const data = await response.json();
      setRepositories(data || []); // Ensure we always set an array
      setError(null);
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRepositories([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const createRepository = async (repositoryData: {
    fullName: string;
    description?: string;
    stars?: number;
    forks?: number;
    language?: string;
    isPrivate?: boolean;
  }) => {
    try {
      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(repositoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If user not found, try to initialize them first
        if (errorData.error?.includes('User not found') || response.status === 500) {
          try {
            // Initialize user in database
            await fetch('/api/users/init', { method: 'POST' });
            
            // Retry the repository creation
            const retryResponse = await fetch('/api/repositories', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(repositoryData),
            });

            if (!retryResponse.ok) {
              const retryError = await retryResponse.json();
              throw new Error(retryError.error || 'Failed to create repository after user initialization');
            }

            const newRepository = await retryResponse.json();
            setRepositories(prev => [newRepository, ...prev]);
            return newRepository;
          } catch (initError) {
            console.error('Failed to initialize user:', initError);
            throw new Error('Failed to create repository. Please refresh the page and try again.');
          }
        }
        
        throw new Error(errorData.error || 'Failed to create repository');
      }

      const newRepository = await response.json();
      setRepositories(prev => [newRepository, ...prev]);
      return newRepository;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create repository');
    }
  };

  const updateRepository = async (id: string, updates: Partial<Repository>) => {
    try {
      const response = await fetch(`/api/repositories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update repository');
      }

      const updatedRepository = await response.json();
      setRepositories(prev => 
        prev.map(repository => 
          repository.id === id ? updatedRepository : repository
        )
      );
      return updatedRepository;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update repository');
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  return {
    repositories,
    isLoading,
    error,
    createRepository,
    updateRepository,
    refetch: fetchRepositories,
  };
} 