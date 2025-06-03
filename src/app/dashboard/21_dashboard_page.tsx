'use client';

import { useUser } from '@clerk/nextjs';
import { useConvexUser } from '@/lib/hooks/use-convex-user';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/11_components_ui';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { isSignedIn } = useUser();
  const { user: convexUser, isLoading } = useConvexUser();
  
  const earnings = useQuery(
    api.payments.getUserEarnings,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  ) || { totalEarnings: 0 };
  
  const repositories = useQuery(
    api.repositories.getRepositoriesByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  ) || [];
  
  const campaigns = useQuery(
    api.campaigns.getCampaignsByAdvertiser,
    convexUser?._id ? { advertiserId: convexUser._id } : "skip"
  ) || [];
  
  const activeCampaigns = campaigns.filter((campaign: { status: string }) => campaign.status === 'active');

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
          <Link href="/" className="text-green-200 hover:text-white">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-white hover:text-green-200">Overview</Link>
              <Link href="/dashboard/repositories" className="text-white/70 hover:text-white">Repositories</Link>
              <Link href="/dashboard/analytics" className="text-white/70 hover:text-white">Analytics</Link>
              <Link href="/dashboard/campaigns" className="text-white/70 hover:text-white">Campaigns</Link>
              <Link href="/dashboard/payouts" className="text-white/70 hover:text-white">Payouts</Link>
              <Link href="/settings" className="text-white/70 hover:text-white">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {convexUser?.name || 'Developer'}!
          </h2>
          <p className="text-white/70">
            Here&apos;s an overview of your monetization performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${((earnings.totalEarnings || 0) / 100).toFixed(2)}
              </div>
              <p className="text-xs text-green-200">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Active Repositories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {repositories.length || 0}
              </div>
              <p className="text-xs text-green-200">Connected to GitHub</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Active Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {activeCampaigns.length || 0}
              </div>
              <p className="text-xs text-green-200">Currently running</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-sm">
                  {convexUser?.plan?.toUpperCase() || 'FREE'}
                </Badge>
              </div>
              <p className="text-xs text-green-200 mt-1">
                {convexUser?.plan === 'free' ? '70% revenue share' : 
                 convexUser?.plan === 'pro' ? '85% revenue share' : '90% revenue share'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link 
                href="/dashboard/repositories" 
                className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <h3 className="font-semibold text-white mb-1">Connect Repository</h3>
                <p className="text-sm text-white/70">Add a new GitHub repository to start monetizing</p>
              </Link>
              
              <Link 
                href="/dashboard/campaigns" 
                className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <h3 className="font-semibold text-white mb-1">Create Campaign</h3>
                <p className="text-sm text-white/70">Set up a new advertising campaign</p>
              </Link>
              
              <Link 
                href="/pricing" 
                className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <h3 className="font-semibold text-white mb-1">Upgrade Plan</h3>
                <p className="text-sm text-white/70">Increase your revenue share with Pro or Enterprise</p>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-white">New ad impression on react-components</p>
                    <p className="text-xs text-white/50">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-white">Payment processed: $24.50</p>
                    <p className="text-xs text-white/50">1 hour ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-white">Repository analytics updated</p>
                    <p className="text-xs text-white/50">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

