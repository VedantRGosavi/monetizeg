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
      <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden flex items-center justify-center">
        {/* Background gradient and noise overlay */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />
        
        <div className="relative z-10 text-center text-white">
          <h1 className="text-2xl font-mono font-semibold mb-4 lowercase">access denied</h1>
          <p className="mb-4 lowercase">please sign in to access your dashboard.</p>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-mono font-semibold text-white mb-2 lowercase">
            welcome back, {displayName || 'developer'}!
          </h1>
          <p className="text-white/70 lowercase">
            here&apos;s an overview of your monetization performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70 lowercase">total earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${((earnings.totalEarnings || 0) / 100).toFixed(2)}
              </div>
              <p className="text-xs text-white/40 lowercase">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70 lowercase">active repositories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {repositories.length || 0}
              </div>
              <p className="text-xs text-white/40 lowercase">connected to github</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70 lowercase">active ads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {activeCampaigns.length || 0}
              </div>
              <p className="text-xs text-white/40 lowercase">currently running</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70 lowercase">current plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white lowercase">
                  {plan?.toLowerCase() || 'free'}
                </Badge>
              </div>
              <p className="text-xs text-white/40 mt-1 lowercase">
                {plan === 'free' ? '70% revenue share' : 
                 plan === 'pro' ? '85% revenue share' : '90% revenue share'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white lowercase">quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link 
                href="/dashboard/repositories" 
                className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <h3 className="font-semibold text-white mb-1 lowercase">connect repository</h3>
                <p className="text-sm text-white/70 lowercase">add a new github repository to start monetizing</p>
              </Link>
              
              <Link 
                href="/dashboard/campaigns" 
                className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <h3 className="font-semibold text-white mb-1 lowercase">create campaign</h3>
                <p className="text-sm text-white/70 lowercase">set up a new advertising campaign</p>
              </Link>
              
              <Link 
                href="/pricing" 
                className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <h3 className="font-semibold text-white mb-1 lowercase">upgrade plan</h3>
                <p className="text-sm text-white/70 lowercase">increase your revenue share with pro or enterprise</p>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white lowercase">recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-white lowercase">new ad impression on react-components</p>
                    <p className="text-xs text-white/60 lowercase">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-white lowercase">payment processed: $24.50</p>
                    <p className="text-xs text-white/60 lowercase">1 hour ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                  <div>
                    <p className="text-sm text-white lowercase">repository analytics updated</p>
                    <p className="text-xs text-white/60 lowercase">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <style jsx global>{`
        .bg-phalo-green { background: #123c2b; }
      `}</style>
    </div>
  );
}

