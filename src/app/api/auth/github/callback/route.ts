import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('GitHub OAuth error:', error);
      return NextResponse.redirect(new URL('/dashboard/repositories?error=github_auth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/repositories?error=missing_code', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token');
      return NextResponse.redirect(new URL('/dashboard/repositories?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub token error:', tokenData.error);
      return NextResponse.redirect(new URL('/dashboard/repositories?error=github_token_error', request.url));
    }

    const accessToken = tokenData.access_token;
    
    // Store the access token temporarily in session/cookie (in production, you'd want to encrypt this)
    const response = NextResponse.redirect(new URL('/dashboard/repositories?github_connected=true', request.url));
    
    // Set httpOnly cookie with the access token (expires in 1 hour)
    response.cookies.set('github_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    });

    return response;
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(new URL('/dashboard/repositories?error=callback_error', request.url));
  }
} 