import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { createInitialUser, getUserByClerkId } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/auth-utils';

// Clerk webhook event types
type ClerkWebhookEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted' | 'session.created' | 'session.ended';
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    username?: string;
    created_at: number;
    updated_at: number;
    last_sign_in_at?: number;
    banned?: boolean;
    locked?: boolean;
  };
  object: 'event';
  timestamp: number;
};

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Get the headers
    const headerPayload = await headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing svix headers');
      return NextResponse.json(
        { error: 'Missing required webhook headers' },
        { status: 400 }
      );
    }

    // Get the body
    const payload = await request.text();

    // Create a new Svix instance with your webhook secret
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'CLERK_WEBHOOK_SECRET environment variable is required' },
        { status: 500 }
      );
    }
    
    const wh = new Webhook(webhookSecret);

    let event: ClerkWebhookEvent;

    // Verify the payload with the headers
    try {
      event = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // Handle the webhook event
    const { type, data } = event;
    console.log(`Received Clerk webhook: ${type} for user ${data.id}`);

    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      
      case 'session.created':
        await handleSessionCreated(data);
        break;
      
      case 'session.ended':
        await handleSessionEnded(data);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    const response = NextResponse.json({ received: true });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleUserCreated(userData: ClerkWebhookEvent['data']) {
  try {
    console.log('Creating user in database:', userData.id);
    
    // Validate required data
    if (!userData.email_addresses || userData.email_addresses.length === 0) {
      console.error('No email addresses found for user:', userData.id);
      throw new Error('User email is required');
    }
    
    // Check if user already exists
    const existingUser = await getUserByClerkId(userData.id);
    if (existingUser) {
      console.log('User already exists, skipping creation');
      return;
    }

    // Create user in database
    await createInitialUser({
      id: userData.id,
      emailAddresses: userData.email_addresses.map(email => ({
        emailAddress: email.email_address
      })),
      firstName: userData.first_name || undefined,
      lastName: userData.last_name || undefined,
      imageUrl: userData.image_url || undefined,
    });

    console.log('User created successfully in database');
  } catch (error) {
    console.error('Error creating user from webhook:', error);
    
    // Don't throw error for webhook - just log it
    // Throwing would cause webhook to retry indefinitely
    if (error instanceof Error) {
      console.error('Webhook user creation failed:', {
        userId: userData.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

async function handleUserUpdated(userData: ClerkWebhookEvent['data']) {
  try {
    console.log('Updating user in database:', userData.id);
    
    const email = userData.email_addresses[0]?.email_address;
    if (!email) {
      console.error('No email found for user update');
      return;
    }

    const name = userData.first_name && userData.last_name 
      ? `${userData.first_name} ${userData.last_name}` 
      : userData.first_name || userData.last_name || null;

    // Update user in database
    await prisma.user.upsert({
      where: { clerkId: userData.id },
      update: {
        email,
        name,
        avatarUrl: userData.image_url || null,
        updatedAt: new Date(),
      },
      create: {
        clerkId: userData.id,
        email,
        name,
        avatarUrl: userData.image_url || null,
      },
    });

    console.log('User updated successfully in database');
  } catch (error) {
    console.error('Error updating user from webhook:', error);
    throw error;
  }
}

async function handleUserDeleted(userData: ClerkWebhookEvent['data']) {
  try {
    console.log('Deleting user from database:', userData.id);
    
    // Get user to check if they exist
    const user = await getUserByClerkId(userData.id);
    if (!user) {
      console.log('User not found in database, skipping deletion');
      return;
    }

    // Delete user and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user's campaigns
      await tx.campaign.deleteMany({
        where: { userId: user.id }
      });

      // Delete user's repositories
      await tx.repository.deleteMany({
        where: { userId: user.id }
      });

      // Delete user's payments
      await tx.payment.deleteMany({
        where: { userId: user.id }
      });

      // Delete user's repository metrics
      await tx.repositoryMetric.deleteMany({
        where: { repository: { userId: user.id } }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    console.log('User and related data deleted successfully from database');
  } catch (error) {
    console.error('Error deleting user from webhook:', error);
    throw error;
  }
}

async function handleSessionCreated(userData: ClerkWebhookEvent['data']) {
  try {
    console.log('Session created for user:', userData.id);
    
    // Update user record (no lastSignInAt field in schema)
    await prisma.user.updateMany({
      where: { clerkId: userData.id },
      data: {
        updatedAt: new Date(),
      },
    });

    console.log('User last sign-in time updated');
  } catch (error) {
    console.error('Error handling session created:', error);
    // Don't throw here as this is not critical
  }
}

async function handleSessionEnded(userData: ClerkWebhookEvent['data']) {
  try {
    console.log('Session ended for user:', userData.id);
    
    // Could implement session tracking here if needed
    // For now, just log the event
    
  } catch (error) {
    console.error('Error handling session ended:', error);
    // Don't throw here as this is not critical
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

