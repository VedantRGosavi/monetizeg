'use client';

import { useUserData } from '@/lib/hooks/use-user-data';
import { useStripe } from '@/lib/hooks/use-stripe';
import Link from 'next/link';
import { Button, Card, CardHeader, CardContent, CardTitle, Badge } from '@/components/11_components_ui';

export default function SettingsPage() {
  const { clerkUser, isSignedIn, isLoading, plan, githubUsername, createdAt, email } = useUserData();
  const { createCheckoutSession } = useStripe();

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    try {
      // In a real app, you'd use actual Stripe price IDs
      const priceId = plan === 'pro' ? 'price_pro_monthly' : 'price_enterprise_monthly';
      await createCheckoutSession(priceId);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to start upgrade process');
    }
  };

  if (!isSignedIn) {
    return (
      <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden flex items-center justify-center">
        {/* Background gradient and noise overlay */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />
        
        <div className="relative z-10 text-center text-white">
          <h1 className="text-2xl font-mono font-semibold mb-4 lowercase">access denied</h1>
          <p className="mb-4 lowercase">please sign in to access settings.</p>
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
              <h1 className="text-4xl font-mono font-semibold text-white mb-2 lowercase">settings</h1>
              <p className="text-white/70 lowercase">manage your account and subscription settings.</p>
            </div>
            <Link href="/dashboard">
              <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">← back to dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Information */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white lowercase">account information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-white/70 text-sm lowercase">name</label>
                <p className="text-white font-medium">{clerkUser?.fullName || 'not provided'}</p>
              </div>
              <div>
                <label className="text-white/70 text-sm lowercase">email</label>
                <p className="text-white font-medium">{email || 'not provided'}</p>
              </div>
              <div>
                <label className="text-white/70 text-sm lowercase">github username</label>
                <p className="text-white font-medium">{githubUsername || 'not connected'}</p>
              </div>
              <div>
                <label className="text-white/70 text-sm lowercase">member since</label>
                <p className="text-white font-medium">
                  {createdAt ? new Date(createdAt).toLocaleDateString() : 'unknown'}
                </p>
              </div>
              <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                edit profile
              </Button>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white lowercase">subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium lowercase">current plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`lowercase ${plan === 'free' ? 'bg-white/20 text-white' : 'bg-white text-phalo-green'}`}>
                      {plan?.toUpperCase() || 'FREE'}
                    </Badge>
                    {/* Subscription status will be implemented with PostgreSQL */}
                  </div>
                </div>
                {plan === 'free' && (
                  <Button size="sm" className="bg-white text-phalo-green hover:bg-opacity-90 lowercase" onClick={() => handleUpgrade('pro')}>
                    upgrade
                  </Button>
                )}
              </div>

              {/* Subscription management will be implemented with PostgreSQL */}

              {plan === 'free' && (
                <div className="space-y-3">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-white font-medium mb-2 lowercase">upgrade benefits</h4>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• higher revenue share (85% vs 70%)</li>
                      <li>• unlimited repositories</li>
                      <li>• advanced analytics</li>
                      <li>• priority support</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-white text-phalo-green hover:bg-opacity-90 lowercase" onClick={() => handleUpgrade('pro')}>
                      upgrade to pro
                    </Button>
                    <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase" onClick={() => handleUpgrade('enterprise')}>
                      enterprise
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white lowercase">preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium lowercase">email notifications</p>
                  <p className="text-white/70 text-sm lowercase">receive updates about your earnings and campaigns</p>
                </div>
                <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                  configure
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium lowercase">auto-payout</p>
                  <p className="text-white/70 text-sm lowercase">automatically request payouts when threshold is met</p>
                </div>
                <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                  enable
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium lowercase">api access</p>
                  <p className="text-white/70 text-sm lowercase">generate api keys for programmatic access</p>
                </div>
                <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                  manage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-400 lowercase">danger zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium lowercase">export data</p>
                  <p className="text-white/70 text-sm lowercase">download all your data in json format</p>
                </div>
                <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                  export
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium lowercase">delete account</p>
                  <p className="text-white/70 text-sm lowercase">permanently delete your account and all data</p>
                </div>
                <Button variant="secondary" size="sm" className="text-red-400 border-red-400/30 hover:bg-red-500/20 bg-white/5 lowercase">
                  delete
                </Button>
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

