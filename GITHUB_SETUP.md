# GitHub OAuth Setup for MonetizeG

This guide will help you set up GitHub OAuth integration for your MonetizeG application.

## 1. Create a GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: MonetizeG
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Click "Register application"

## 2. Get Your Credentials

After creating the app, you'll see:
- **Client ID**: Copy this value
- **Client Secret**: Generate and copy this value

## 3. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

Note: 
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` is used in the frontend
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are used in the backend API

## 4. For Production

When deploying to production:

1. Update your GitHub OAuth app settings:
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/api/auth/github/callback`

2. Update your environment variables with production values

## 5. Database Setup

Make sure your database has the required tables. The app expects:
- `users` table with columns: `id`, `clerk_id`, `email`, `name`, `avatar_url`, `created_at`, `updated_at`
- `repositories` table with columns: `id`, `user_id`, `full_name`, `description`, `stars`, `forks`, `language`, `is_private`, `is_monetized`, `ad_placement_enabled`, `ad_placement_max_ads`, `ad_placement_position`, `ad_placement_categories`, `created_at`, `updated_at`

## 6. Testing

1. Start your development server: `npm run dev`
2. Go to `/dashboard/repositories`
3. Click "Connect GitHub Account"
4. Authorize the app on GitHub
5. You should be redirected back and see "GitHub account connected"
6. Click "Import repositories" to fetch your GitHub repos
7. Select repos to connect and click "Connect X repositories"

## Troubleshooting

### "GitHub OAuth not configured"
- Make sure `NEXT_PUBLIC_GITHUB_CLIENT_ID` is set in your environment variables
- Restart your development server after adding environment variables

### "User not found in database"
- This should now be automatically handled by the app
- If it persists, make sure your database is properly set up and accessible

### "Failed to fetch repositories from GitHub"
- Check that your GitHub OAuth app settings match your callback URL
- Verify your client ID and secret are correct

### Database Connection Issues
- Make sure your `DATABASE_URL` environment variable is set
- Verify your database is running and accessible
- Check that the required tables exist

## Security Notes

- Never commit your GitHub client secret to version control
- Use environment variables for all sensitive credentials
- In production, ensure your OAuth callback URL uses HTTPS
- The app stores GitHub access tokens temporarily in secure HTTP-only cookies 