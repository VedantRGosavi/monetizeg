import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Type assertion to access subscription properties
    const subData = subscription as unknown as {
      cancel_at_period_end: boolean;
      current_period_end: number;
    };

    return NextResponse.json({ 
      success: true, 
      cancelAtPeriodEnd: subData.cancel_at_period_end,
      currentPeriodEnd: subData.current_period_end * 1000, // Convert to milliseconds
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Immediately cancel the subscription
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    // Type assertion to access subscription properties
    const subData = subscription as unknown as {
      status: string;
      canceled_at: number | null;
    };

    return NextResponse.json({ 
      success: true, 
      status: subData.status,
      canceledAt: subData.canceled_at, // Changed from 'canceled' to 'canceledAt' to match the expected type
    });
  } catch (error) {
    console.error('Error canceling subscription immediately:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

