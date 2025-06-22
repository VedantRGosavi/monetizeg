'use client';

import { useUser } from '@clerk/nextjs';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/11_components_ui';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleUpgrade = async (priceId: string) => {
    if (!isSignedIn) {
      // Redirect to sign up
      router.push('/sign-up');
      return;
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="relative min-h-screen font-sans bg-phalo overflow-hidden">
      {/* Background gradient and noise overlay */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <Link 
          href="/" 
          className="flex items-center space-x-2 text-2xl font-mono font-semibold text-white hover:text-white/80 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>monetizeG</span>
        </Link>
        <div className="flex gap-4">
          {isSignedIn ? (
            <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">Dashboard</Button>
          ) : (
            <>
              <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">Sign In</Button>
              <Button className="bg-white text-phalo-green hover:bg-opacity-90">Sign Up</Button>
            </>
          )}
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-mono font-semibold text-white mb-6 tracking-wide lowercase">
            choose your plan
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto lowercase">
            start monetizing your open source projects today. upgrade anytime to increase your revenue share.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Free Plan */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg relative">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-white lowercase">free</CardTitle>
              <div className="text-4xl font-bold text-white">
                $0<span className="text-lg text-white/60">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-white/80">
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  70% revenue share
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  up to 3 repositories
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  basic analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  community support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  github integration
                </li>
              </ul>
              <Button 
                className="w-full mt-6 bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase" 
                variant="secondary"
                onClick={() => !isSignedIn && (window.location.href = '/sign-up')}
              >
                {isSignedIn ? 'current plan' : 'get started free'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-white/10 backdrop-blur-sm border-2 border-white/30 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="px-4 py-1 bg-white text-phalo-green lowercase">
                most popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-white lowercase">pro</CardTitle>
              <div className="text-4xl font-bold text-white">
                $29<span className="text-lg text-white/60">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-white/80">
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  85% revenue share
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  unlimited repositories
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  advanced analytics & insights
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  priority support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  custom ad targeting
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  api access
                </li>
              </ul>
              <Button 
                className="w-full mt-6 bg-white text-phalo-green hover:bg-opacity-90 lowercase"
                onClick={() => handleUpgrade('price_pro_monthly')}
              >
                upgrade to pro
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg relative">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-white lowercase">enterprise</CardTitle>
              <div className="text-4xl font-bold text-white">
                $99<span className="text-lg text-white/60">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-white/80">
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  90% revenue share
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  unlimited repositories
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  custom integrations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  white-label options
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  dedicated account manager
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  sla guarantee
                </li>
              </ul>
              <Button 
                className="w-full mt-6 bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase" 
                variant="secondary"
                onClick={() => handleUpgrade('price_enterprise_monthly')}
              >
                contact sales
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-mono font-semibold text-white text-center mb-12 lowercase">
            frequently asked questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3 lowercase">
                how does revenue sharing work?
              </h3>
              <p className="text-white/70">
                you keep 70-90% of all ad revenue generated from your repositories. we handle all payment processing and advertiser relationships.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3 lowercase">
                what types of ads are shown?
              </h3>
              <p className="text-white/70">
                only contextually relevant, developer-focused ads that respect your project&apos;s audience and maintain code quality.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3 lowercase">
                can i control which ads appear?
              </h3>
              <p className="text-white/70">
                yes! you have full control over ad categories, can blacklist specific advertisers, and set content guidelines.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3 lowercase">
                how often do i get paid?
              </h3>
              <p className="text-white/70">
                payments are processed monthly via stripe, with a minimum payout threshold of $50.
              </p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

