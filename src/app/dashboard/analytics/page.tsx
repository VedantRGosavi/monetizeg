'use client';

import { useUser } from '@clerk/nextjs';
import { useConvexUser } from '@/lib/hooks/use-convex-user';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import Link from 'next/link';


export default function AnalyticsPage() {
  const { isSignedIn } = useUser();
  const { user: convexUser, isLoading } = useConvexUser();
  
  const repositories = useQuery(
    api.repositories.getRepositoriesByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const earnings = useQuery(
    api.payments.getUserEarnings,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-phalo-green flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">Please sign in to access analytics.</p>
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

  const monetizedRepos = repositories?.filter((r: { isMonetized: boolean; _id: string; fullName: string }) => r.isMonetized) || [];

  return (
    <div className="min-h-screen bg-phalo-green">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
              <p className="text-white/70">Track your ad performance and revenue metrics.</p>
            </div>
            <Link href="/dashboard" className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-white/70 text-sm font-medium mb-2">Total Impressions</h3>
            <p className="text-3xl font-bold text-white">12,543</p>
            <p className="text-green-400 text-sm mt-1">+15.3% from last month</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-white/70 text-sm font-medium mb-2">Total Clicks</h3>
            <p className="text-3xl font-bold text-white">1,234</p>
            <p className="text-green-400 text-sm mt-1">+8.7% from last month</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-white/70 text-sm font-medium mb-2">Click-Through Rate</h3>
            <p className="text-3xl font-bold text-white">9.84%</p>
            <p className="text-red-400 text-sm mt-1">-2.1% from last month</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-white/70 text-sm font-medium mb-2">Revenue This Month</h3>
            <p className="text-3xl font-bold text-white">${((earnings?.totalEarnings || 0) / 100).toFixed(2)}</p>
            <p className="text-green-400 text-sm mt-1">+22.5% from last month</p>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Performance Over Time</h2>
          <div className="h-64 bg-white/5 rounded-lg flex items-center justify-center">
            <div className="text-center text-white/70">
              <div className="text-4xl mb-2">📊</div>
              <p>Performance chart will be displayed here</p>
              <p className="text-sm">Integration with charting library needed</p>
            </div>
          </div>
        </div>

        {/* Repository Performance */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Repository Performance</h2>
          
          {monetizedRepos.length > 0 ? (
            <div className="space-y-4">
              {monetizedRepos.map((repo: { _id: string; fullName: string; description?: string; isMonetized: boolean }) => (
                <div key={repo._id} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{repo.fullName}</h3>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                      Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-white/60 text-sm">Impressions</p>
                      <p className="text-white font-semibold">{Math.floor(Math.random() * 5000) + 1000}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Clicks</p>
                      <p className="text-white font-semibold">{Math.floor(Math.random() * 500) + 50}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">CTR</p>
                      <p className="text-white font-semibold">{(Math.random() * 10 + 5).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Revenue</p>
                      <p className="text-white font-semibold">${(Math.random() * 100 + 20).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-white mb-2">No monetized repositories</h3>
              <p className="text-white/70 mb-6">Enable monetization on your repositories to start tracking analytics.</p>
              <Link href="/dashboard/repositories" className="px-6 py-3 bg-white text-phalo-green rounded-lg font-medium hover:bg-opacity-90 transition">
                Manage Repositories
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

