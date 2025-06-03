'use client';

import { useUser } from '@clerk/nextjs';
import { useConvexUser } from '@/lib/hooks/use-convex-user';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import Link from 'next/link';
import { Button, Card, CardHeader, CardContent, CardTitle, Badge } from '@/components/11_components_ui';

interface Payment {
  _id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  currency: string;
  type: 'earning' | 'payout' | 'subscription';
  description?: string;
  createdAt: number;
  processedAt?: number;
  metadata?: {
    adId?: string;
    repositoryId?: string;
    period?: string;
  };
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  userId: string;
}

export default function PayoutsPage() {
  const { isSignedIn } = useUser();
  const { user: convexUser, isLoading } = useConvexUser();
  
  const payments = useQuery(
    api.payments.getPaymentsByUser,
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
          <p className="mb-4">Please sign in to access payouts.</p>
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

  const availableBalance = (earnings?.availableBalance || 0) / 100;
  const canRequestPayout = availableBalance >= 50; // $50 minimum

  return (
    <div className="min-h-screen bg-phalo-green">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Payouts</h1>
              <p className="text-white/70">Manage your earnings and payout settings.</p>
            </div>
            <Link href="/dashboard">
              <Button variant="secondary">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-white/70 text-sm font-medium mb-2">Available Balance</h3>
            <p className="text-3xl font-bold text-white">${availableBalance.toFixed(2)}</p>
            <p className="text-white/60 text-sm mt-1">Ready for payout</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-white/70 text-sm font-medium mb-2">Total Earnings</h3>
            <p className="text-3xl font-bold text-white">${((earnings?.totalEarnings || 0) / 100).toFixed(2)}</p>
            <p className="text-green-400 text-sm mt-1">All time</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-white/70 text-sm font-medium mb-2">Total Payouts</h3>
            <p className="text-3xl font-bold text-white">${((earnings?.totalPayouts || 0) / 100).toFixed(2)}</p>
            <p className="text-white/60 text-sm mt-1">Withdrawn</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-white/70 text-sm font-medium mb-2">Pending Earnings</h3>
            <p className="text-3xl font-bold text-white">${((earnings?.pendingEarnings || 0) / 100).toFixed(2)}</p>
            <p className="text-yellow-400 text-sm mt-1">Processing</p>
          </Card>
        </div>

        {/* Payout Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 mb-2">
                  You have <span className="font-semibold">${availableBalance.toFixed(2)}</span> available for payout.
                </p>
                <p className="text-white/60 text-sm">
                  {canRequestPayout 
                    ? "You can request a payout now. Payments are processed within 2-3 business days."
                    : `Minimum payout amount is $50. You need $${(50 - availableBalance).toFixed(2)} more to request a payout.`
                  }
                </p>
              </div>
              <Button disabled={!canRequestPayout}>
                {canRequestPayout ? "Request Payout" : "Minimum Not Met"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <div className="space-y-4">
                {payments.slice(0, 10).map((payment: Payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white font-medium">
                          {payment.type === 'earning' ? 'Ad Revenue' : 
                           payment.type === 'payout' ? 'Payout' : 'Subscription'}
                        </span>
                        <Badge variant={
                          payment.status === 'completed' ? 'success' :
                          payment.status === 'pending' ? 'warning' :
                          payment.status === 'failed' ? 'error' : 'default'
                        }>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-white/70">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                      <p className="text-white/60 text-sm">
                        {payment.description || 'No description'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        payment.type === 'earning' ? 'text-green-400' : 
                        payment.type === 'payout' ? 'text-red-400' : 'text-white'
                      }`}>
                        {payment.type === 'earning' ? '+' : payment.type === 'payout' ? '-' : ''}
                        ${(payment.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-white/60 text-sm">{payment.currency.toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-white mb-2">No payment history</h3>
                <p className="text-white/70 mb-6">Your earnings and payouts will appear here once you start monetizing repositories.</p>
                <Link href="/dashboard/repositories">
                  <Button>Start Monetizing</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-white font-medium mb-2">Payment Method</h4>
                <p className="text-white/70 text-sm mb-3">
                  Configure your preferred payment method for receiving payouts.
                </p>
                <Button variant="secondary" size="sm">
                  Setup Payment Method
                </Button>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-white font-medium mb-2">Tax Information</h4>
                <p className="text-white/70 text-sm mb-3">
                  Provide tax information for compliance and reporting purposes.
                </p>
                <Button variant="secondary" size="sm">
                  Update Tax Info
                </Button>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-white font-medium mb-2">Automatic Payouts</h4>
                <p className="text-white/70 text-sm mb-3">
                  Enable automatic monthly payouts when your balance reaches the minimum threshold.
                </p>
                <Button variant="secondary" size="sm">
                  Enable Auto-Payout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

