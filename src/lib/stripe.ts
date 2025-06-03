import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export const STRIPE_PLANS = {
  pro: {
    priceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    yearlyPriceId: 'price_pro_yearly', // Replace with actual Stripe price ID
  },
  enterprise: {
    priceId: 'price_enterprise_monthly', // Replace with actual Stripe price ID
    yearlyPriceId: 'price_enterprise_yearly', // Replace with actual Stripe price ID
  },
} as const;

