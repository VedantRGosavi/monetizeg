'use client';

import { useUser } from '@clerk/nextjs';
import { useConvexUser } from '@/lib/hooks/use-convex-user';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useState } from 'react';
import Link from 'next/link';

interface Repository {
  _id: Id<"repositories">;
  fullName: string;
  description?: string;
  isMonetized: boolean;
  stars: number;
  forks: number;
  language?: string;
  isPrivate: boolean;
  adPlacementConfig?: {
    enabled: boolean;
    maxAds: number;
    placement: "top" | "middle" | "bottom";
    categories: string[];
  };
}

export default function RepositoriesPage() {
  const { isSignedIn } = useUser();
  const { user: convexUser, isLoading } = useConvexUser();
  const [githubUrl, setGithubUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const repositories = useQuery(
    api.repositories.getRepositoriesByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const addRepository = useMutation(api.repositories.addRepository);
  const updateMonetization = useMutation(api.repositories.updateRepositoryMonetization);

  const handleConnectRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl || !convexUser) return;

    setIsConnecting(true);
    try {
      // Parse GitHub URL to extract owner and repo name
      const urlParts = githubUrl.replace('https://github.com/', '').split('/');
      if (urlParts.length < 2) {
        alert('Invalid GitHub URL format');
        return;
      }

      const [owner, repoName] = urlParts;
      const fullName = `${owner}/${repoName}`;

      // Mock repository data (in real app, this would come from GitHub API)
      await addRepository({
        userId: convexUser._id,
        githubId: Math.floor(Math.random() * 1000000), // Mock ID
        name: repoName,
        fullName,
        description: `Repository ${repoName}`,
        language: 'JavaScript',
        stars: Math.floor(Math.random() * 1000),
        forks: Math.floor(Math.random() * 100),
        isPrivate: false,
        defaultBranch: 'main',
      });

      setGithubUrl('');
      alert('Repository connected successfully!');
    } catch (error) {
      console.error('Error connecting repository:', error);
      alert('Failed to connect repository');
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleMonetization = async (repoId: Id<"repositories">, currentStatus: boolean) => {
    try {
      await updateMonetization({
        repositoryId: repoId,
        isMonetized: !currentStatus,
        adPlacementConfig: !currentStatus ? {
          enabled: true,
          maxAds: 3,
          placement: 'middle',
          categories: ['technology', 'development'],
        } : undefined,
      });
    } catch (error) {
      console.error('Error updating monetization:', error);
      alert('Failed to update monetization settings');
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-phalo-green flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">Please sign in to access your repositories.</p>
          <Link href="/" className="text-white underline">Go back to home</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-phalo-green flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-phalo-green">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Repositories</h1>
              <p className="text-white/70">Manage your GitHub repositories and monetization settings.</p>
            </div>
            <Link href="/dashboard" className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Connect Repository Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Connect New Repository</h2>
          <form onSubmit={handleConnectRepo} className="flex gap-4">
            <input
              type="url"
              placeholder="https://github.com/username/repository"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isConnecting}
              className="px-6 py-3 bg-white text-phalo-green rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          </form>
          <p className="text-white/60 text-sm mt-2">
            Paste the full GitHub URL of your repository to connect it to monetizeG.
          </p>
        </div>

        {/* Repositories List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Your Repositories</h2>
          
          {repositories && repositories.length > 0 ? (
            <div className="space-y-4">
              {repositories.map((repo: Repository) => (
                <div key={repo._id} className="p-6 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{repo.fullName}</h3>
                        {repo.isMonetized ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                            Monetized
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
                            Not Monetized
                          </span>
                        )}
                      </div>
                      
                      <p className="text-white/70 mb-3">{repo.description || 'No description available'}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-white/60 mb-4">
                        <span className="flex items-center gap-1">
                          ⭐ {repo.stars} stars
                        </span>
                        <span className="flex items-center gap-1">
                          🍴 {repo.forks} forks
                        </span>
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            📝 {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          🔒 {repo.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>

                      {repo.isMonetized && repo.adPlacementConfig && (
                        <div className="p-3 bg-white/5 rounded-lg mb-4">
                          <h4 className="text-white font-medium mb-2">Monetization Settings</h4>
                          <div className="text-sm text-white/70 space-y-1">
                            <p>Max Ads: {repo.adPlacementConfig.maxAds}</p>
                            <p>Placement: {repo.adPlacementConfig.placement}</p>
                            {repo.adPlacementConfig.categories.length > 0 && (
                              <p>Categories: {repo.adPlacementConfig.categories.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-6">
                      <button
                        onClick={() => toggleMonetization(repo._id, repo.isMonetized)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          repo.isMonetized
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        {repo.isMonetized ? 'Disable Monetization' : 'Enable Monetization'}
                      </button>
                      
                      <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
                        View Analytics
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold text-white mb-2">No repositories connected</h3>
              <p className="text-white/70 mb-6">Connect your first GitHub repository to start monetizing your open source projects.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

