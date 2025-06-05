import { NextRequest, NextResponse } from 'next/server';
import { createCampaign, getCampaigns } from '@/lib/db';

export async function GET() {
  try {
    const campaigns = await getCampaigns();
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, description, budgetTotal, budgetDailyLimit, startDate, endDate } = body;
    
    if (!name || !budgetTotal || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, budgetTotal, startDate' },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      name,
      description,
      budgetTotal: parseFloat(budgetTotal),
      budgetDailyLimit: budgetDailyLimit ? parseFloat(budgetDailyLimit) : undefined,
      startDate,
      endDate,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
} 