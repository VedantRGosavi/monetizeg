# Deployment Guide for MonetizeG

This guide covers deploying MonetizeG to production on the domain `monetizeg.dev` using Vercel.

## Prerequisites

- Domain: `monetizeg.dev` configured in your DNS provider
- Vercel account with GitHub repository connected
- Production environment variables configured

## Environment Variables

Set these environment variables in your Vercel dashboard:

### Database
- `DATABASE_URL`: Your production PostgreSQL database URL

### Authentication (Clerk)
- `CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key

### GitHub OAuth
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`: Your GitHub OAuth app client ID
- `GITHUB_CLIENT_ID`: Your GitHub OAuth app client ID (same as above)
- `GITHUB_CLIENT_SECRET`: Your GitHub OAuth app client secret

### Stripe
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

### Application
- `NEXT_PUBLIC_APP_URL`: `https://monetizeg.dev`
- `NEXTAUTH_URL`: `https://monetizeg.dev`
- `NODE_ENV`: `production`

## GitHub OAuth Configuration

Update your GitHub OAuth app settings:

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Select your MonetizeG app
3. Update the following:
   - **Homepage URL**: `https://monetizeg.dev`
   - **Authorization callback URL**: `https://monetizeg.dev/api/auth/github/callback`

## Stripe Webhook Configuration

Configure your Stripe webhook endpoint:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add a new endpoint: `https://monetizeg.dev/api/stripe/webhook`
3. Select the following events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Domain Configuration

### DNS Settings
Point your domain to Vercel:
- Add a CNAME record: `monetizeg.dev` → `cname.vercel-dns.com`
- Add a CNAME record: `www.monetizeg.dev` → `cname.vercel-dns.com`

### Vercel Domain Settings
1. In your Vercel project dashboard
2. Go to Settings → Domains
3. Add `monetizeg.dev` as your custom domain
4. Add `www.monetizeg.dev` as a redirect to `monetizeg.dev`

## Deployment Steps

1. **Push to GitHub**: All changes should be committed and pushed to your main branch

2. **Automatic Deployment**: Vercel will automatically deploy when you push to main

3. **Environment Variables**: Ensure all environment variables are set in Vercel dashboard

4. **Database Migration**: Run any pending database migrations if needed

5. **Verify Deployment**: 
   - Visit `https://monetizeg.dev`
   - Test GitHub OAuth flow
   - Test Stripe payment flow
   - Verify webhook endpoints

## Security Features

The deployment includes:
- HTTPS enforcement
- Security headers (HSTS, XSS Protection, etc.)
- WWW to non-WWW redirect
- CORS configuration for API routes

## Monitoring

Monitor your deployment:
- Vercel Dashboard for deployment logs
- Stripe Dashboard for payment events
- GitHub OAuth app for authentication metrics

## Troubleshooting

### Common Issues

1. **GitHub OAuth Error**: Check callback URL matches exactly
2. **Stripe Webhook Error**: Verify webhook endpoint URL and secret
3. **Database Connection**: Ensure DATABASE_URL is correct for production
4. **Environment Variables**: Double-check all variables are set in Vercel

### Logs
- Check Vercel function logs for API errors
- Monitor Stripe webhook delivery attempts
- Review GitHub OAuth app activity

## Post-Deployment Checklist

- [ ] Domain resolves to the application
- [ ] HTTPS is working
- [ ] GitHub OAuth login works
- [ ] Stripe payments work
- [ ] Webhooks are receiving events
- [ ] Database operations are working
- [ ] All environment variables are set
- [ ] Security headers are present 