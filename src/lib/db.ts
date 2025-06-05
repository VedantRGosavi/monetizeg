import { neon } from '@neondatabase/serverless';
import { auth } from '@clerk/nextjs/server';

const sql = neon(process.env.DATABASE_URL!);

// Database connection with Clerk user context
export async function getDbWithAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Set the current user ID for RLS policies
  await sql`SELECT set_config('app.current_user_id', ${userId}, true)`;
  
  return { sql, userId };
}

// Initial user creation (no auth required)
export async function createInitialUser(clerkUser: {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
}) {
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const name = clerkUser.firstName && clerkUser.lastName 
    ? `${clerkUser.firstName} ${clerkUser.lastName}` 
    : clerkUser.firstName || clerkUser.lastName || null;

  const result = await sql`
    INSERT INTO users (clerk_id, email, name, avatar_url)
    VALUES (${clerkUser.id}, ${email}, ${name}, ${clerkUser.imageUrl})
    ON CONFLICT (clerk_id) 
    DO UPDATE SET 
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = now()
    RETURNING *
  `;

  return result[0];
}

// User management (requires auth)
export async function createOrUpdateUser(clerkUser: {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
}) {
  // Try to get auth context, if it fails, use initial creation
  try {
    const { sql: authSql } = await getDbWithAuth();
    
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = clerkUser.firstName && clerkUser.lastName 
      ? `${clerkUser.firstName} ${clerkUser.lastName}` 
      : clerkUser.firstName || clerkUser.lastName || null;

    const result = await authSql`
      INSERT INTO users (clerk_id, email, name, avatar_url)
      VALUES (${clerkUser.id}, ${email}, ${name}, ${clerkUser.imageUrl})
      ON CONFLICT (clerk_id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now()
      RETURNING *
    `;

    return result[0];
  } catch (error) {
    // If auth fails (user not yet authenticated), use initial creation
    if (error instanceof Error && error.message === 'Unauthorized') {
      return await createInitialUser(clerkUser);
    }
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { sql, userId } = await getDbWithAuth();
    
    const result = await sql`
      SELECT * FROM users WHERE clerk_id = ${userId}
    `;

    return result[0] || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Get user by Clerk ID without auth requirement (for initial setup)
export async function getUserByClerkId(clerkId: string) {
  try {
    const result = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId}
    `;

    return result[0] || null;
  } catch (error) {
    console.error('Error getting user by clerk ID:', error);
    return null;
  }
}

// Campaign operations
export async function createCampaign(data: {
  name: string;
  description?: string;
  budgetTotal: number;
  budgetDailyLimit?: number;
  startDate: string;
  endDate?: string;
}) {
  const { sql } = await getDbWithAuth();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('User not found');
  }

  const result = await sql`
    INSERT INTO campaigns (user_id, name, description, budget_total, budget_daily_limit, start_date, end_date)
    VALUES (${user.id}, ${data.name}, ${data.description}, ${data.budgetTotal}, ${data.budgetDailyLimit}, ${data.startDate}, ${data.endDate})
    RETURNING *
  `;

  return result[0];
}

export async function getCampaigns() {
  const { sql } = await getDbWithAuth();
  
  const result = await sql`
    SELECT * FROM campaigns 
    ORDER BY created_at DESC
  `;

  return result;
}

export async function updateCampaign(id: string, data: Partial<{
  name: string;
  description: string;
  status: string;
  budgetTotal: number;
  budgetDailyLimit: number;
  startDate: string;
  endDate: string;
}>) {
  const { sql } = await getDbWithAuth();
  
  // Build individual update fields
  const fieldsToUpdate = [];
  if (data.name !== undefined) fieldsToUpdate.push('name');
  if (data.description !== undefined) fieldsToUpdate.push('description');
  if (data.status !== undefined) fieldsToUpdate.push('status');
  if (data.budgetTotal !== undefined) fieldsToUpdate.push('budgetTotal');
  if (data.budgetDailyLimit !== undefined) fieldsToUpdate.push('budgetDailyLimit');
  if (data.startDate !== undefined) fieldsToUpdate.push('startDate');
  if (data.endDate !== undefined) fieldsToUpdate.push('endDate');
  
  if (fieldsToUpdate.length === 0) {
    throw new Error('No fields to update');
  }

  const result = await sql`
    UPDATE campaigns 
    SET name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        status = COALESCE(${data.status}, status),
        budget_total = COALESCE(${data.budgetTotal}, budget_total),
        budget_daily_limit = COALESCE(${data.budgetDailyLimit}, budget_daily_limit),
        start_date = COALESCE(${data.startDate}, start_date),
        end_date = COALESCE(${data.endDate}, end_date),
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  return result[0];
}

// Repository operations
export async function createRepository(data: {
  fullName: string;
  description?: string;
  stars?: number;
  forks?: number;
  language?: string;
  isPrivate?: boolean;
}) {
  const { sql } = await getDbWithAuth();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('User not found');
  }

  const result = await sql`
    INSERT INTO repositories (user_id, full_name, description, stars, forks, language, is_private)
    VALUES (${user.id}, ${data.fullName}, ${data.description}, ${data.stars || 0}, ${data.forks || 0}, ${data.language}, ${data.isPrivate || false})
    RETURNING *
  `;

  return result[0];
}

export async function getRepositories() {
  const { sql } = await getDbWithAuth();
  
  // Check if user exists first
  const user = await getCurrentUser();
  if (!user) {
    // Return empty array if user doesn't exist yet
    return [];
  }
  
  const result = await sql`
    SELECT * FROM repositories 
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
  `;

  return result;
}

export async function updateRepository(id: string, data: Partial<{
  is_monetized: boolean;
  ad_placement_enabled: boolean;
  ad_placement_max_ads: number;
  ad_placement_position: string;
  ad_placement_categories: string[];
}>) {
  const { sql } = await getDbWithAuth();
  
  // Build individual update fields
  const fieldsToUpdate = [];
  if (data.is_monetized !== undefined) fieldsToUpdate.push('is_monetized');
  if (data.ad_placement_enabled !== undefined) fieldsToUpdate.push('ad_placement_enabled');
  if (data.ad_placement_max_ads !== undefined) fieldsToUpdate.push('ad_placement_max_ads');
  if (data.ad_placement_position !== undefined) fieldsToUpdate.push('ad_placement_position');
  if (data.ad_placement_categories !== undefined) fieldsToUpdate.push('ad_placement_categories');
  
  if (fieldsToUpdate.length === 0) {
    throw new Error('No fields to update');
  }

  const result = await sql`
    UPDATE repositories 
    SET is_monetized = COALESCE(${data.is_monetized}, is_monetized),
        ad_placement_enabled = COALESCE(${data.ad_placement_enabled}, ad_placement_enabled),
        ad_placement_max_ads = COALESCE(${data.ad_placement_max_ads}, ad_placement_max_ads),
        ad_placement_position = COALESCE(${data.ad_placement_position}, ad_placement_position),
        ad_placement_categories = COALESCE(${JSON.stringify(data.ad_placement_categories) || null}, ad_placement_categories::text)::text[],
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  return result[0];
}

// Payment operations
export async function createPayment(data: {
  amount: number;
  currency?: string;
  type: 'earning' | 'payout' | 'subscription';
  description?: string;
  metadata?: Record<string, unknown>;
  stripePaymentIntentId?: string;
}) {
  const { sql } = await getDbWithAuth();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('User not found');
  }

  const result = await sql`
    INSERT INTO payments (user_id, amount, currency, type, description, metadata, stripe_payment_intent_id)
    VALUES (${user.id}, ${data.amount}, ${data.currency || 'USD'}, ${data.type}, ${data.description}, ${JSON.stringify(data.metadata || {})}, ${data.stripePaymentIntentId})
    RETURNING *
  `;

  return result[0];
}

export async function getPayments() {
  const { sql } = await getDbWithAuth();
  
  const result = await sql`
    SELECT * FROM payments 
    ORDER BY created_at DESC
  `;

  return result;
}

export async function updatePaymentStatus(id: string, status: 'pending' | 'completed' | 'failed' | 'cancelled', processedAt?: string) {
  const { sql } = await getDbWithAuth();
  
  const result = await sql`
    UPDATE payments 
    SET status = ${status}, processed_at = ${processedAt || null}, updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  return result[0];
} 