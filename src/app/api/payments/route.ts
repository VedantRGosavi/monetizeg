import { NextRequest, NextResponse } from 'next/server';
import { createPayment, getPayments } from '@/lib/db';

export async function GET() {
  try {
    const payments = await getPayments();
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { amount, currency, type, description, metadata, stripePaymentIntentId } = body;
    
    if (!amount || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, type' },
        { status: 400 }
      );
    }

    if (!['earning', 'payout', 'subscription'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be earning, payout, or subscription' },
        { status: 400 }
      );
    }

    const payment = await createPayment({
      amount: parseFloat(amount),
      currency: currency || 'USD',
      type,
      description,
      metadata,
      stripePaymentIntentId,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
} 