'use client';

import { useUser } from '@clerk/nextjs';
import { useConvexUser } from '../../../../src/lib/hooks/use-convex-user';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useState } from 'react';
import Link from 'next/link';

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  status: string;
  budget: {
    total: number;
    spent: number;
    dailyLimit?: number;
  };
  startDate: number;
  endDate?: number;
  advertiserId: string;
}
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export default function CampaignsPage() {
  const { isSignedIn } = useUser();
  const { user: convexUser, isLoading } = useConvexUser();
  const [showCreateForm, setShowCreateForm] = useState(false);
  type FormData = {
    name: string;
    description: string;
    budget: string;
    dailyLimit: string;
    startDate: string;
    endDate: string;
  };

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    budget: '',
    dailyLimit: '',
    startDate: '',
    endDate: '',
  });

  const campaigns = useQuery(
    api.campaigns.getCampaignsByAdvertiser,
    convexUser?._id ? { advertiserId: convexUser._id as Id<"users"> } : "skip"
  ) as Campaign[] || [];

  const createCampaign = useMutation(api.campaigns.createCampaign);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!convexUser) return;

    try {
      await createCampaign({
        advertiserId: convexUser._id,
        name: formData.name,
        description: formData.description || undefined,
        budget: {
          total: parseInt(formData.budget) * 100, // Convert to cents
          dailyLimit: formData.dailyLimit ? parseInt(formData.dailyLimit) * 100 : undefined,
        },
        startDate: new Date(formData.startDate).getTime(),
        endDate: formData.endDate ? new Date(formData.endDate).getTime() : undefined,
      });

      setFormData({
        name: '',
        description: '',
        budget: '',
        dailyLimit: '',
        startDate: '',
        endDate: '',
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-phalo-green flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">Please sign in to access campaigns.</p>
          <Link href="/" className="text-white underline">Go back to home</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-phalo-green flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-phalo-green">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Advertising Campaigns</h1>
              <p className="text-white/70">Create and manage your advertising campaigns to reach developers.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard">
                <Button variant="secondary">← Back to Dashboard</Button>
              </Link>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Campaign
              </Button>
            </div>
          </div>
        </div>

        {/* Create Campaign Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Total Budget (USD) *</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="1"
                      value={formData.budget}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="dailyLimit">Daily Limit (USD)</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      min="1"
                      value={formData.dailyLimit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, dailyLimit: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit">Create Campaign</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns && campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns?.map((campaign: Campaign) => (
                  <div key={campaign._id} className="p-6 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
                          <Badge variant={
                            campaign.status === 'active' ? 'default' :
                            campaign.status === 'paused' ? 'secondary' :
                            campaign.status === 'completed' ? 'outline' : 'destructive'
                          }>
                            {campaign.status}
                          </Badge>
                        </div>
                        {campaign.description && (
                          <p className="text-white/70 mb-3">{campaign.description}</p>
                        )}
                        <div className="flex items-center gap-6 text-sm text-white/60">
                          <span>Budget: ${campaign.budget.total.toFixed(2)}</span>
                          <span>Spent: ${campaign.budget.spent.toFixed(2)}</span>
                          <span>Start: {new Date(campaign.startDate).toLocaleDateString()} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary">
                          Edit
                        </Button>
                        <Button size="sm" variant="secondary">
                          View Ads
                        </Button>
                        <Button size="sm" variant="secondary">
                          Analytics
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((campaign.budget.spent / campaign.budget.total) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>${campaign.budget.spent.toFixed(2)} / ${campaign.budget.total.toFixed(2)} ({((campaign.budget.spent / campaign.budget.total) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📢</div>
                <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
                <p className="text-white/70 mb-6">Create your first advertising campaign to start reaching developers.</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Your First Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

