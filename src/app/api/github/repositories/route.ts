import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRepositories } from '@/lib/db';
import { UserService } from '@/lib/services/user.service';

export async function GET() {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get GitHub client with securely stored token
    let octokit;
    try {
      octokit = await UserService.getGitHubClient();
    } catch (tokenError) {
      console.error('GitHub token error:', tokenError instanceof Error ? tokenError.message : 'Unknown error');
      return NextResponse.json(
        { error: 'GitHub account not connected. Please connect your GitHub account in settings.' },
        { status: 403 }
      );
    }

    // Fetch user's repositories from GitHub using Octokit
    const { data: repositories } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    });

    // Get already connected repositories
    let connectedRepoNames = new Set<string>();
    try {
      const connectedRepos = await getRepositories();
      connectedRepoNames = new Set(connectedRepos.map(repo => repo.fullName));
    } catch (error) {
      // If user not found or other error, just continue without marking connected repos
      console.log('Could not fetch connected repositories:', error);
    }
    
    // Transform GitHub API response to our format and mark connected ones
    const transformedRepos = repositories.map((repo) => ({
      id: repo.id.toString(),
      full_name: repo.full_name,
      name: repo.name,
      description: repo.description,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      language: repo.language,
      private: repo.private,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url
      },
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      isConnected: connectedRepoNames.has(repo.full_name)
    }));

    return NextResponse.json(transformedRepos);
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to fetch repositories from GitHub' },
      { status: 500 }
    );
  }
}
