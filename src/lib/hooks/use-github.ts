'use client';

import { useState, useCallback } from 'react';

export interface GitHubRepository {
  id: string;
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  isConnected?: boolean; // Whether this repo is already connected to MonetizeG
}

export function useGitHub() {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGitHubRepositories = useCallback(async (accessToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/github/repositories?token=${encodeURIComponent(accessToken)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch repositories');
      }
      
      const data: GitHubRepository[] = await response.json();
      setRepositories(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connectRepository = useCallback(async (repo: GitHubRepository) => {
    try {
      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: repo.full_name,
          description: repo.description,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          isPrivate: repo.private,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect repository');
      }

      const connectedRepo = await response.json();
      
      // Mark this repository as connected
      setRepositories(prev => 
        prev.map(r => 
          r.id === repo.id ? { ...r, isConnected: true } : r
        )
      );
      
      return connectedRepo;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to connect repository');
    }
  }, []);

  const connectMultipleRepositories = useCallback(async (repos: GitHubRepository[]) => {
    const results = [];
    const errors = [];

    for (const repo of repos) {
      try {
        const result = await connectRepository(repo);
        results.push(result);
      } catch (error) {
        errors.push({ repo: repo.full_name, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return { results, errors };
  }, [connectRepository]);

  // Generate GitHub OAuth URL for user authorization
  const getGitHubAuthUrl = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new Error('GitHub OAuth not configured');
    }

    const redirectUri = `${window.location.origin}/api/auth/github/callback`;
    const scope = 'repo';
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in localStorage for verification
    localStorage.setItem('github_oauth_state', state);

    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  }, []);

  return {
    repositories,
    isLoading,
    error,
    fetchGitHubRepositories,
    connectRepository,
    connectMultipleRepositories,
    getGitHubAuthUrl,
    clearError: () => setError(null),
    clearRepositories: () => setRepositories([]),
  };
} 