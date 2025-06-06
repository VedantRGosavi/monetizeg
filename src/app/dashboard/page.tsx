'use client';

import { useUserData } from '@/lib/hooks/use-user-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function DashboardPage() {
  const { isSignedIn, isLoading, displayName, plan } = useUserData();
  
  // Temporary static data until PostgreSQL is implemented
  const earnings = { totalEarnings: 0 };
  const repositories: Array<{ name: string; status: string }> = [];
  const campaigns: Array<{ status: string }> = [];
  
  const activeCampaigns = campaigns.filter((campaign: { status: string }) => campaign.status === 'active');

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Please sign in to access your dashboard</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {displayName || 'Developer'}!
        </h1>
        <p className="text-gray-600">
          Here&apos;s an overview of your monetization performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${((earnings.totalEarnings || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Repositories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {repositories.length || 0}
            </div>
            <p className="text-xs text-gray-500">Connected to GitHub</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {activeCampaigns.length || 0}
            </div>
            <p className="text-xs text-gray-500">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {plan?.toUpperCase() || 'FREE'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {plan === 'free' ? '70% revenue share' : 
               plan === 'pro' ? '85% revenue share' : '90% revenue share'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link 
              href="/dashboard/repositories" 
              className="block p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">Connect Repository</h3>
              <p className="text-sm text-gray-600">Add a new GitHub repository to start monetizing</p>
            </Link>
            
            <Link 
              href="/dashboard/campaigns" 
              className="block p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">Create Campaign</h3>
              <p className="text-sm text-gray-600">Set up a new advertising campaign</p>
            </Link>
            
            <Link 
              href="/pricing" 
              className="block p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">Upgrade Plan</h3>
              <p className="text-sm text-gray-600">Increase your revenue share with Pro or Enterprise</p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-900">New ad impression on react-components</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-900">Payment processed: $24.50</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-900">Repository analytics updated</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

