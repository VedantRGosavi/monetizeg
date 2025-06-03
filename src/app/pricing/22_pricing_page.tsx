'use client';

import { useUser } from '@clerk/nextjs';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/11_components_ui';
import { useStripe } from '@/lib/hooks/use-stripe';

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const { createCheckoutSession } = useStripe();

  const handleUpgrade = async (priceId: string) => {
    if (!isSignedIn) {
      // Redirect to sign up
      window.location.href = '/sign-up';
      return;
    }

    try {
      await createCheckoutSession(priceId);
    } catch (error) {
      console.error('Error upgrading:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold text-white">
          monetizeG
        </div>
        <div className="flex gap-4">
          {isSignedIn ? (
            <Button variant="secondary">Dashboard</Button>
          ) : (
            <>
              <Button variant="secondary">Sign In</Button>
              <Button>Sign Up</Button>
            </>
          )}
        </div>
      </header>

      <div className="container mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Start monetizing your open source projects today. Upgrade anytime to increase your revenue share.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Free Plan */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 relative">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Free</CardTitle>
              <div className="text-4xl font-bold text-green-200">
                $0<span className="text-lg text-white/60">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-white/80">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  70% revenue share
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Up to 3 repositories
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Basic analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Community support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  GitHub integration
                </li>
              </ul>
              <Button 
                className="w-full mt-6" 
                variant="secondary"
                onClick={() => !isSignedIn && (window.location.href = '/sign-up')}
              >
                {isSignedIn ? 'Current Plan' : 'Get Started Free'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-white/20 backdrop-blur-sm border-2 border-green-300 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge variant="success" className="px-4 py-1">
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Pro</CardTitle>
              <div className="text-4xl font-bold text-green-200">
                $29<span className="text-lg text-white/60">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-white/80">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  85% revenue share
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Unlimited repositories
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Advanced analytics & insights
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Custom ad targeting
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  API access
                </li>
              </ul>
              <Button 
                className="w-full mt-6 bg-green-300 text-green-800 hover:bg-green-200"
                onClick={() => handleUpgrade('price_pro_monthly')}
              >
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 relative">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Enterprise</CardTitle>
              <div className="text-4xl font-bold text-green-200">
                $99<span className="text-lg text-white/60">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-white/80">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  90% revenue share
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Unlimited repositories
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Custom integrations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  White-label options
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Dedicated account manager
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  SLA guarantee
                </li>
              </ul>
              <Button 
                className="w-full mt-6" 
                variant="secondary"
                onClick={() => handleUpgrade('price_enterprise_monthly')}
              >
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                How does revenue sharing work?
              </h3>
              <p className="text-white/70">
                You keep 70-90% of all ad revenue generated from your repositories. We handle all payment processing and advertiser relationships.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                What types of ads are shown?
              </h3>
              <p className="text-white/70">
                Only contextually relevant, developer-focused ads that respect your project&apos;s audience and maintain code quality.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Can I control which ads appear?
              </h3>
              <p className="text-white/70">
                Yes! You have full control over ad categories, can blacklist specific advertisers, and set content guidelines.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                How often do I get paid?
              </h3>
              <p className="text-white/70">
                Payments are processed monthly via Stripe, with a minimum payout threshold of $50.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

