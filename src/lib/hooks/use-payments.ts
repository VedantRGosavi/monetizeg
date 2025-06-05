'use client';

import { useState, useEffect } from 'react';

export interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  currency: string;
  type: 'earning' | 'payout' | 'subscription';
  description?: string;
  created_at: string;
  processed_at?: string;
  metadata?: Record<string, unknown>;
  stripe_payment_intent_id?: string;
  stripe_transfer_id?: string;
  user_id: string;
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      
      const data = await response.json();
      setPayments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createPayment = async (paymentData: {
    amount: number;
    currency?: string;
    type: 'earning' | 'payout' | 'subscription';
    description?: string;
    metadata?: Record<string, unknown>;
    stripePaymentIntentId?: string;
  }) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const newPayment = await response.json();
      setPayments(prev => [newPayment, ...prev]);
      return newPayment;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create payment');
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return {
    payments,
    isLoading,
    error,
    createPayment,
    refetch: fetchPayments,
  };
} 