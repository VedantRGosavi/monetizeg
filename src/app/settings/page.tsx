'use client';

import { useUser } from '@clerk/nextjs';
import { useConvexUser } from '@/lib/hooks/use-convex-user';
import { useStripe } from '@/lib/hooks/use-stripe';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Link from 'next/link';
import { Button, Card, CardHeader, CardContent, CardTitle, Badge } from '@/components/11_components_ui';

export default function SettingsPage() {
  const { user: clerkUser, isSignedIn } = useUser();
  const { user: convexUser, isLoading } = useConvexUser();
  const { createCheckoutSession, cancelSubscription, openCustomerPortal } = useStripe();
  
  const subscription = useQuery(
    api.payments.getUserSubscription,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

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

  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) return;
    
    const confirmed = confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.');
    if (!confirmed) return;

    try {
      await cancelSubscription(subscription.stripeSubscriptionId);
      alert('Subscription canceled successfully. It will remain active until the end of your billing period.');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  const handleManageBilling = async () => {
    if (!convexUser?.stripeCustomerId) return;
    
    try {
      await openCustomerPortal(convexUser.stripeCustomerId);
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Failed to open billing portal');
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-phalo-green flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">Please sign in to access settings.</p>
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

  return (
    <div className="min-h-screen bg-phalo-green">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
              <p className="text-white/70">Manage your account and subscription settings.</p>
            </div>
            <Link href="/dashboard">
              <Button variant="secondary">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-white/70 text-sm">Name</label>
                <p className="text-white font-medium">{clerkUser?.fullName || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-white/70 text-sm">Email</label>
                <p className="text-white font-medium">{clerkUser?.emailAddresses[0]?.emailAddress}</p>
              </div>
              <div>
                <label className="text-white/70 text-sm">GitHub Username</label>
                <p className="text-white font-medium">{convexUser?.githubUsername || 'Not connected'}</p>
              </div>
              <div>
                <label className="text-white/70 text-sm">Member Since</label>
                <p className="text-white font-medium">
                  {convexUser?.createdAt ? new Date(convexUser.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <Button variant="secondary" size="sm">
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Current Plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={convexUser?.plan === 'free' ? 'default' : 'success'}>
                      {convexUser?.plan?.toUpperCase() || 'FREE'}
                    </Badge>
                    {subscription?.status && (
                      <Badge variant={
                        subscription.status === 'active' ? 'success' :
                        subscription.status === 'cancelled' ? 'warning' : 'error'
                      }>
                        {subscription.status}
                      </Badge>
                    )}
                  </div>
                </div>
                {convexUser?.plan === 'free' && (
                  <Button size="sm" onClick={() => handleUpgrade('pro')}>
                    Upgrade
                  </Button>
                )}
              </div>

              {subscription && (
                <div className="space-y-3">
                  <div>
                    <label className="text-white/70 text-sm">Billing Period</label>
                    <p className="text-white font-medium">
                      {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {subscription.cancelAtPeriodEnd && (
                    <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        Your subscription will be canceled at the end of the current billing period.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {convexUser?.stripeCustomerId && (
                      <Button variant="secondary" size="sm" onClick={handleManageBilling}>
                        Manage Billing
                      </Button>
                    )}
                    {!subscription.cancelAtPeriodEnd && (
                      <Button variant="secondary" size="sm" onClick={handleCancelSubscription}>
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {convexUser?.plan === 'free' && (
                <div className="space-y-3">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Upgrade Benefits</h4>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• Higher revenue share (85% vs 70%)</li>
                      <li>• Unlimited repositories</li>
                      <li>• Advanced analytics</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpgrade('pro')}>
                      Upgrade to Pro
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleUpgrade('enterprise')}>
                      Enterprise
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-white/70 text-sm">Receive updates about your earnings and campaigns</p>
                </div>
                <Button variant="secondary" size="sm">
                  Configure
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Auto-Payout</p>
                  <p className="text-white/70 text-sm">Automatically request payouts when threshold is met</p>
                </div>
                <Button variant="secondary" size="sm">
                  Enable
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">API Access</p>
                  <p className="text-white/70 text-sm">Generate API keys for programmatic access</p>
                </div>
                <Button variant="secondary" size="sm">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Export Data</p>
                  <p className="text-white/70 text-sm">Download all your data in JSON format</p>
                </div>
                <Button variant="secondary" size="sm">
                  Export
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Delete Account</p>
                  <p className="text-white/70 text-sm">Permanently delete your account and all data</p>
                </div>
                <Button variant="secondary" size="sm" className="text-red-400 border-red-400/30 hover:bg-red-500/20">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

