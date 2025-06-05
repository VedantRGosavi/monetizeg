'use client';

import { useUser } from '@clerk/nextjs';
import { useConvexUser } from '@/lib/hooks/use-convex-user';
import { useRepositories, type Repository } from '@/lib/hooks/use-repositories';
import { useGitHub, type GitHubRepository } from '@/lib/hooks/use-github';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RepositoriesPage() {
  const { isSignedIn } = useUser();
  const { isLoading } = useConvexUser();
  const { repositories, createRepository } = useRepositories();
  const { 
    repositories: githubRepos, 
    isLoading: isLoadingGitHub, 
    error: githubError,
    fetchGitHubRepositories,
    connectMultipleRepositories,
    clearError
  } = useGitHub();
  
  const [githubUrl, setGithubUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showGitHubRepos, setShowGitHubRepos] = useState(false);
  const [githubToken, setGitHubToken] = useState<string | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [isConnectingMultiple, setIsConnectingMultiple] = useState(false);

  // Check for GitHub connection on mount and URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('github_connected') === 'true') {
      // GitHub OAuth was successful, fetch the token
      fetchGitHubToken();
      // Clear the URL parameter
      window.history.replaceState({}, '', '/dashboard/repositories');
    }
    
    // Initialize user if needed
    initializeUserIfNeeded();
  }, []);

  const initializeUserIfNeeded = async () => {
    try {
      // Try to fetch current user to see if they exist in database
      const userResponse = await fetch('/api/users');
      if (!userResponse.ok || !(await userResponse.json())) {
        // User doesn't exist, initialize them
        await fetch('/api/users/init', { method: 'POST' });
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      // Don't show error to user, just log it
    }
  };

  const fetchGitHubToken = async () => {
    try {
      const response = await fetch('/api/github/token');
      if (response.ok) {
        const data = await response.json();
        setGitHubToken(data.token);
      }
    } catch (error) {
      console.error('Failed to fetch GitHub token:', error);
    }
  };

  const handleGitHubConnect = async () => {
    try {
      // Create GitHub OAuth URL and redirect
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      if (!clientId) {
        alert('GitHub OAuth is not configured. Please contact support.');
        return;
      }

      const redirectUri = `${window.location.origin}/api/auth/github/callback`;
      const scope = 'repo';
      const state = Math.random().toString(36).substring(2, 15);
      
      // Store state in localStorage for verification
      localStorage.setItem('github_oauth_state', state);

      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to GitHub:', error);
      alert('Failed to connect to GitHub');
    }
  };

  const handleFetchGitHubRepos = async () => {
    if (!githubToken) {
      alert('Please connect your GitHub account first');
      return;
    }

    try {
      await fetchGitHubRepositories(githubToken);
      setShowGitHubRepos(true);
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      alert('Failed to fetch GitHub repositories');
    }
  };

  const handleConnectSelectedRepos = async () => {
    if (selectedRepos.size === 0) {
      alert('Please select at least one repository to connect');
      return;
    }

    setIsConnectingMultiple(true);
    try {
      const reposToConnect = githubRepos.filter(repo => selectedRepos.has(repo.id));
      const { results, errors } = await connectMultipleRepositories(reposToConnect);
      
      if (errors.length > 0) {
        console.error('Some repositories failed to connect:', errors);
        
        // Show detailed error information
        const errorMessages = errors.map(e => `${e.repo}: ${e.error}`).join('\n');
        alert(`Connected ${results.length} repositories. ${errors.length} failed to connect:\n\n${errorMessages}`);
        
        // If all failed due to user not found, suggest refreshing
        if (errors.every(e => e.error.includes('account is not properly initialized'))) {
          if (confirm('It seems your account needs to be initialized. Would you like to refresh the page?')) {
            window.location.reload();
          }
        }
      } else {
        alert(`Successfully connected ${results.length} repositories!`);
        // Refresh the repositories list
        window.location.reload();
      }
      
      setSelectedRepos(new Set());
      setShowGitHubRepos(false);
    } catch (error) {
      console.error('Error connecting repositories:', error);
      alert(`Failed to connect repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnectingMultiple(false);
    }
  };

  const addRepository = async () => {
    if (!githubUrl) return;
    
    // Parse GitHub URL to get fullName
    const urlParts = githubUrl.replace('https://github.com/', '').split('/');
    if (urlParts.length < 2) {
      throw new Error('Invalid GitHub URL');
    }
    const fullName = `${urlParts[0]}/${urlParts[1]}`;
    
    await createRepository({
      fullName,
      description: 'Repository connected from GitHub',
      isPrivate: false,
    });
  };
  
  const updateMonetization = async () => {
    // TODO: Implement monetization update
    console.log('Monetization update will be implemented');
  };

  const handleConnectRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl) return;

    setIsConnecting(true);
    try {
      await addRepository();
      setGithubUrl('');
      alert('Repository connected successfully!');
    } catch (error) {
      console.error('Error connecting repository:', error);
      alert(`Failed to connect repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleMonetization = async () => {
    try {
      await updateMonetization();
      alert('Monetization update will be implemented with PostgreSQL');
    } catch (error) {
      console.error('Error updating monetization:', error);
      alert('Failed to update monetization settings');
    }
  };

  const toggleRepoSelection = (repoId: string) => {
    setSelectedRepos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(repoId)) {
        newSet.delete(repoId);
      } else {
        newSet.add(repoId);
      }
      return newSet;
    });
  };

  if (!isSignedIn) {
    return (
      <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden flex items-center justify-center">
        {/* Background gradient and noise overlay */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />
        
        <div className="relative z-10 text-center text-white">
          <h1 className="text-2xl font-mono font-semibold mb-4 lowercase">access denied</h1>
          <p className="mb-4 lowercase">please sign in to access your repositories.</p>
          <Link href="/" className="text-white/70 hover:text-white underline lowercase">go back to home</Link>
        </div>
        
        <style jsx global>{`
          .bg-phalo-green { background: #123c2b; }
        `}</style>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden flex items-center justify-center">
        {/* Background gradient and noise overlay */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />
        
        <div className="relative z-10 text-white lowercase">loading...</div>
        
        <style jsx global>{`
          .bg-phalo-green { background: #123c2b; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden">
      {/* Background gradient and noise overlay */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-mono font-semibold text-white mb-2 lowercase">repositories</h1>
              <p className="text-white/70 lowercase">manage your github repositories and monetization settings.</p>
            </div>
            <Link href="/dashboard" className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition lowercase">
              ← back to dashboard
            </Link>
          </div>
        </div>

        {/* GitHub Integration Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg mb-8">
          <h2 className="text-2xl font-mono font-semibold text-white mb-4 lowercase">github integration</h2>
          
          {!githubToken ? (
            <div className="space-y-4">
              <p className="text-white/70 lowercase">connect your github account to automatically import and manage all your repositories.</p>
              <button
                onClick={handleGitHubConnect}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition flex items-center gap-2 lowercase"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                connect github account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white lowercase">github account connected</span>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleFetchGitHubRepos}
                  disabled={isLoadingGitHub}
                  className="px-6 py-3 bg-white text-phalo-green rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50 lowercase"
                >
                  {isLoadingGitHub ? 'loading...' : 'import repositories'}
                </button>
                
                <button
                  onClick={() => fetch('/api/github/token', { method: 'DELETE' }).then(() => setGitHubToken(null))}
                  className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30 transition lowercase"
                >
                  disconnect github
                </button>
              </div>
            </div>
          )}

          {githubError && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{githubError}</p>
              <button 
                onClick={clearError}
                className="text-red-400 hover:text-red-300 text-sm underline mt-1"
              >
                dismiss
              </button>
            </div>
          )}
        </div>

        {/* GitHub Repositories Selection */}
        {showGitHubRepos && githubRepos.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-mono font-semibold text-white lowercase">select repositories to import</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRepos(new Set(githubRepos.map(r => r.id)))}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition lowercase"
                >
                  select all
                </button>
                <button
                  onClick={() => setSelectedRepos(new Set())}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition lowercase"
                >
                  clear all
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-3 mb-4">
              {githubRepos.map((repo: GitHubRepository) => (
                <div key={repo.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <input
                    type="checkbox"
                    checked={selectedRepos.has(repo.id)}
                    onChange={() => toggleRepoSelection(repo.id)}
                    className="w-4 h-4 text-white bg-white/10 border-white/30 rounded focus:ring-white/30"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{repo.full_name}</h3>
                    <p className="text-white/60 text-sm">{repo.description || 'No description'}</p>
                    <div className="flex items-center gap-4 text-xs text-white/50 mt-1">
                      <span>⭐ {repo.stargazers_count}</span>
                      <span>🍴 {repo.forks_count}</span>
                      {repo.language && <span>📝 {repo.language}</span>}
                      <span>{repo.private ? '🔒 Private' : '🌍 Public'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleConnectSelectedRepos}
                disabled={selectedRepos.size === 0 || isConnectingMultiple}
                className="px-6 py-3 bg-white text-phalo-green rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50 lowercase"
              >
                {isConnectingMultiple ? 'connecting...' : `connect ${selectedRepos.size} repositories`}
              </button>
              
              <button
                onClick={() => setShowGitHubRepos(false)}
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition lowercase"
              >
                cancel
              </button>
            </div>
          </div>
        )}

        {/* Connect Repository Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg mb-8">
          <h2 className="text-2xl font-mono font-semibold text-white mb-4 lowercase">connect individual repository</h2>
          <form onSubmit={handleConnectRepo} className="flex gap-4">
            <input
              type="url"
              placeholder="https://github.com/username/repository"
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 lowercase"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isConnecting}
              className="px-6 py-3 bg-white text-phalo-green rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50 lowercase"
            >
              {isConnecting ? 'connecting...' : 'connect'}
            </button>
          </form>
          <p className="text-white/60 text-sm mt-2 lowercase">
            paste the full github url of your repository to connect it to monetizeg.
          </p>
        </div>

        {/* Repositories List */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg">
          <h2 className="text-2xl font-mono font-semibold text-white mb-6 lowercase">your repositories</h2>
          
          {repositories && repositories.length > 0 ? (
            <div className="space-y-4">
              {repositories.map((repo: Repository) => (
                <div key={repo.id} className="p-6 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{repo.full_name}</h3>
                        {repo.is_monetized ? (
                          <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium lowercase">
                            monetized
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-white/10 text-white/60 rounded-full text-xs font-medium lowercase">
                            not monetized
                          </span>
                        )}
                      </div>
                      
                      <p className="text-white/70 mb-3">{repo.description || 'no description available'}</p>
                      
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
                          🔒 {repo.is_private ? 'private' : 'public'}
                        </span>
                      </div>

                      {repo.is_monetized && repo.ad_placement_enabled && (
                        <div className="p-3 bg-white/5 rounded-lg mb-4 border border-white/10">
                          <h4 className="text-white font-medium mb-2 lowercase">monetization settings</h4>
                          <div className="text-sm text-white/70 space-y-1">
                            <p>max ads: {repo.ad_placement_max_ads}</p>
                            <p>placement: {repo.ad_placement_position}</p>
                            {repo.ad_placement_categories.length > 0 && (
                              <p>categories: {repo.ad_placement_categories.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-6">
                      <button
                        onClick={() => toggleMonetization()}
                        className={`px-4 py-2 rounded-lg font-medium transition lowercase ${
                          repo.is_monetized
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        {repo.is_monetized ? 'disable monetization' : 'enable monetization'}
                      </button>
                      
                      <button className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition lowercase">
                        view analytics
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold text-white mb-2 lowercase">no repositories connected</h3>
              <p className="text-white/70 mb-6 lowercase">connect your first github repository to start monetizing your open source projects.</p>
            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .bg-phalo-green { background: #123c2b; }
      `}</style>
    </div>
  );
}

