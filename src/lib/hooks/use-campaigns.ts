'use client';

import { useState, useEffect } from 'react';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  budget_total: number;
  budget_spent: number;
  budget_daily_limit?: number;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/campaigns');
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      
      const data = await response.json();
      setCampaigns(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createCampaign = async (campaignData: {
    name: string;
    description?: string;
    budgetTotal: number;
    budgetDailyLimit?: number;
    startDate: string;
    endDate?: string;
  }) => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const newCampaign = await response.json();
      setCampaigns(prev => [newCampaign, ...prev]);
      return newCampaign;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create campaign');
    }
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update campaign');
      }

      const updatedCampaign = await response.json();
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === id ? updatedCampaign : campaign
        )
      );
      return updatedCampaign;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update campaign');
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return {
    campaigns,
    isLoading,
    error,
    createCampaign,
    updateCampaign,
    refetch: fetchCampaigns,
  };
} 