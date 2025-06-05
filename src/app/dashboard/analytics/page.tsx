'use client';

import { useUser } from '@clerk/nextjs';
import { useConvexUser } from '@/lib/hooks/use-convex-user';
import Link from 'next/link';


export default function AnalyticsPage() {
  const { isSignedIn } = useUser();
  const { isLoading } = useConvexUser();
  
  // Temporary static data until PostgreSQL is implemented
  const repositories: Array<{ id: string; full_name: string; description?: string; is_monetized: boolean }> = [];
  const earnings = { totalEarnings: 0 };

  if (!isSignedIn) {
    return (
      <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden flex items-center justify-center">
        {/* Background gradient and noise overlay */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />
        
        <div className="relative z-10 text-center text-white">
          <h1 className="text-2xl font-mono font-semibold mb-4 lowercase">access denied</h1>
          <p className="mb-4 lowercase">please sign in to access analytics.</p>
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

  const monetizedRepos = repositories?.filter((r: { is_monetized: boolean; id: string; full_name: string }) => r.is_monetized) || [];

  return (
    <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden">
      {/* Background gradient and noise overlay */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-mono font-semibold text-white mb-2 lowercase">analytics</h1>
              <p className="text-white/70 lowercase">track your ad performance and revenue metrics.</p>
            </div>
            <Link href="/dashboard" className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition lowercase">
              ← back to dashboard
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg">
            <h3 className="text-white/70 text-sm font-medium mb-2 lowercase">total impressions</h3>
            <p className="text-3xl font-bold text-white">12,543</p>
            <p className="text-white/40 text-sm mt-1 lowercase">+15.3% from last month</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg">
            <h3 className="text-white/70 text-sm font-medium mb-2 lowercase">total clicks</h3>
            <p className="text-3xl font-bold text-white">1,234</p>
            <p className="text-white/40 text-sm mt-1 lowercase">+8.7% from last month</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg">
            <h3 className="text-white/70 text-sm font-medium mb-2 lowercase">click-through rate</h3>
            <p className="text-3xl font-bold text-white">9.84%</p>
            <p className="text-red-400 text-sm mt-1 lowercase">-2.1% from last month</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg">
            <h3 className="text-white/70 text-sm font-medium mb-2 lowercase">revenue this month</h3>
            <p className="text-3xl font-bold text-white">${((earnings?.totalEarnings || 0) / 100).toFixed(2)}</p>
            <p className="text-white/40 text-sm mt-1 lowercase">+22.5% from last month</p>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg mb-8">
          <h2 className="text-2xl font-mono font-semibold text-white mb-4 lowercase">performance over time</h2>
          <div className="h-64 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
            <div className="text-center text-white/70">
              <div className="text-4xl mb-2">📊</div>
              <p className="lowercase">performance chart will be displayed here</p>
              <p className="text-sm lowercase">integration with charting library needed</p>
            </div>
          </div>
        </div>

        {/* Repository Performance */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg">
          <h2 className="text-2xl font-mono font-semibold text-white mb-6 lowercase">repository performance</h2>
          
          {monetizedRepos.length > 0 ? (
            <div className="space-y-4">
              {monetizedRepos.map((repo: { id: string; full_name: string; description?: string; is_monetized: boolean }) => (
                <div key={repo.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{repo.full_name}</h3>
                    <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs lowercase">
                      active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-white/60 text-sm lowercase">impressions</p>
                      <p className="text-white font-semibold">{Math.floor(Math.random() * 5000) + 1000}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm lowercase">clicks</p>
                      <p className="text-white font-semibold">{Math.floor(Math.random() * 500) + 50}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm lowercase">ctr</p>
                      <p className="text-white font-semibold">{(Math.random() * 10 + 5).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm lowercase">revenue</p>
                      <p className="text-white font-semibold">${(Math.random() * 100 + 20).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-white mb-2 lowercase">no monetized repositories</h3>
              <p className="text-white/70 mb-6 lowercase">enable monetization on your repositories to start tracking analytics.</p>
              <Link href="/dashboard/repositories" className="px-6 py-3 bg-white text-phalo-green rounded-lg font-medium hover:bg-opacity-90 transition lowercase">
                manage repositories
              </Link>
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

