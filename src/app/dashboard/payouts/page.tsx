'use client';

import { useUserData } from '@/lib/hooks/use-user-data';
import Link from 'next/link';
import { Button, Card, CardHeader, CardContent, CardTitle, Badge } from '@/components/11_components_ui';

interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  currency: string;
  type: 'earning' | 'payout' | 'subscription';
  description?: string;
  created_at: string;
  processed_at?: string;
  metadata?: {
    adId?: string;
    repositoryId?: string;
    period?: string;
  };
  stripe_payment_intent_id?: string;
  stripe_transfer_id?: string;
  user_id: string;
}

export default function PayoutsPage() {
  const { isSignedIn, isLoading } = useUserData();
  
  // Temporary static data until PostgreSQL is implemented
  const payments: Payment[] = [];
  const earnings = { 
    availableBalance: 0, 
    totalEarnings: 0, 
    totalPayouts: 0, 
    pendingEarnings: 0 
  };

  if (!isSignedIn) {
    return (
      <div className="relative min-h-screen font-sans bg-phalo overflow-hidden flex items-center justify-center">
        {/* Background gradient and noise overlay */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />
        
        <div className="relative z-10 text-center text-white">
          <h1 className="text-2xl font-mono font-semibold mb-4 lowercase">access denied</h1>
          <p className="mb-4 lowercase">please sign in to access payouts.</p>
          <Link href="/" className="text-white/70 hover:text-white underline lowercase">go back to home</Link>
        </div>
        
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen font-sans bg-phalo overflow-hidden flex items-center justify-center">
        {/* Background gradient and noise overlay */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />
        
        <div className="relative z-10 text-white lowercase">loading...</div>
        
      </div>
    );
  }

  const availableBalance = (earnings?.availableBalance || 0) / 100;
  const canRequestPayout = availableBalance >= 50; // $50 minimum

  return (
    <div className="relative min-h-screen font-sans bg-phalo overflow-hidden">
      {/* Background gradient and noise overlay */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-mono font-semibold text-white mb-2 lowercase">payouts</h1>
              <p className="text-white/70 lowercase">manage your earnings and payout settings.</p>
            </div>
            <Link href="/dashboard">
              <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">← back to dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="text-white/70 text-sm font-medium mb-2 lowercase">available balance</h3>
            <p className="text-3xl font-bold text-white">${availableBalance.toFixed(2)}</p>
            <p className="text-white/40 text-sm mt-1 lowercase">ready for payout</p>
          </Card>
          <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="text-white/70 text-sm font-medium mb-2 lowercase">total earnings</h3>
            <p className="text-3xl font-bold text-white">${((earnings?.totalEarnings || 0) / 100).toFixed(2)}</p>
            <p className="text-white/40 text-sm mt-1 lowercase">all time</p>
          </Card>
          <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="text-white/70 text-sm font-medium mb-2 lowercase">total payouts</h3>
            <p className="text-3xl font-bold text-white">${((earnings?.totalPayouts || 0) / 100).toFixed(2)}</p>
            <p className="text-white/40 text-sm mt-1 lowercase">withdrawn</p>
          </Card>
          <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="text-white/70 text-sm font-medium mb-2 lowercase">pending earnings</h3>
            <p className="text-3xl font-bold text-white">${((earnings?.pendingEarnings || 0) / 100).toFixed(2)}</p>
            <p className="text-yellow-400 text-sm mt-1 lowercase">processing</p>
          </Card>
        </div>

        {/* Payout Actions */}
        <Card className="mb-8 bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white lowercase">request payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 mb-2 lowercase">
                  you have <span className="font-semibold">${availableBalance.toFixed(2)}</span> available for payout.
                </p>
                <p className="text-white/60 text-sm lowercase">
                  {canRequestPayout 
                    ? "you can request a payout now. payments are processed within 2-3 business days."
                    : `minimum payout amount is $50. you need $${(50 - availableBalance).toFixed(2)} more to request a payout.`
                  }
                </p>
              </div>
              <Button 
                disabled={!canRequestPayout} 
                className={`lowercase ${canRequestPayout ? 'bg-white text-phalo-green hover:bg-opacity-90' : 'bg-white/10 text-white/60 border-white/20'}`}
              >
                {canRequestPayout ? "request payout" : "minimum not met"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white lowercase">payment history</CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <div className="space-y-4">
                {payments.slice(0, 10).map((payment: Payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white font-medium lowercase">
                          {payment.type === 'earning' ? 'ad revenue' : 
                           payment.type === 'payout' ? 'payout' : 'subscription'}
                        </span>
                        <Badge className={`lowercase ${
                          payment.status === 'completed' ? 'bg-white/20 text-white' :
                          payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          payment.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
                        }`}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-white/70">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                      <p className="text-white/60 text-sm lowercase">
                        {payment.description || 'no description'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        payment.type === 'earning' ? 'text-white' : 
                        payment.type === 'payout' ? 'text-white/60' : 'text-white'
                      }`}>
                        {payment.type === 'earning' ? '+' : payment.type === 'payout' ? '-' : ''}
                        ${(payment.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-white/60 text-sm lowercase">{payment.currency.toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-white mb-2 lowercase">no payment history</h3>
                <p className="text-white/70 mb-6 lowercase">your earnings and payouts will appear here once you start monetizing repositories.</p>
                <Link href="/dashboard/repositories">
                  <Button className="bg-white text-phalo-green hover:bg-opacity-90 lowercase">start monetizing</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white lowercase">payment settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-white font-medium mb-2 lowercase">payment method</h4>
                <p className="text-white/70 text-sm mb-3 lowercase">
                  configure your preferred payment method for receiving payouts.
                </p>
                <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                  setup payment method
                </Button>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-white font-medium mb-2 lowercase">tax information</h4>
                <p className="text-white/70 text-sm mb-3 lowercase">
                  provide tax information for compliance and reporting purposes.
                </p>
                <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                  update tax info
                </Button>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-white font-medium mb-2 lowercase">automatic payouts</h4>
                <p className="text-white/70 text-sm mb-3 lowercase">
                  enable automatic monthly payouts when your balance reaches the minimum threshold.
                </p>
                <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                  enable auto-payout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <style jsx global>{`
      `}</style>
    </div>
  );
}

