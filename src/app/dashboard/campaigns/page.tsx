'use client';

import { useUser } from '@clerk/nextjs';
import { useConvexUser } from '../../../../src/lib/hooks/use-convex-user';
import { useCampaigns, type Campaign } from '@/lib/hooks/use-campaigns';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export default function CampaignsPage() {
  const { isSignedIn } = useUser();
  const { isLoading } = useConvexUser();
  const { campaigns, createCampaign: createCampaignDb } = useCampaigns();
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

  const createCampaign = async () => {
    try {
      await createCampaignDb({
        name: formData.name,
        description: formData.description,
        budgetTotal: parseFloat(formData.budget),
        budgetDailyLimit: formData.dailyLimit ? parseFloat(formData.dailyLimit) : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await createCampaign();

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
      <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden flex items-center justify-center">
        {/* Background gradient and noise overlay */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />
        
        <div className="relative z-10 text-center text-white">
          <h1 className="text-2xl font-mono font-semibold mb-4 lowercase">access denied</h1>
          <p className="mb-4 lowercase">please sign in to access campaigns.</p>
          <Link href="/" className="text-white/70 hover:text-white underline lowercase">go back to home</Link>
        </div>
        
        <style jsx global>{`
          .bg-phalo-green { background: #123c2b; }
        `}</style>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden flex items-center justify-center">
        {/* Background gradient and noise overlay */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />
        
        <div className="relative z-10 text-white lowercase">loading...</div>
        
        <style jsx global>{`
          .bg-phalo-green { background: #123c2b; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden">
      {/* Background gradient and noise overlay */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-mono font-semibold text-white mb-2 lowercase">advertising campaigns</h1>
              <p className="text-white/70 lowercase">create and manage your advertising campaigns to reach developers.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard">
                <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">← back to dashboard</Button>
              </Link>
              <Button onClick={() => setShowCreateForm(true)} className="bg-white text-phalo-green hover:bg-opacity-90 lowercase">
                create campaign
              </Button>
            </div>
          </div>
        </div>

        {/* Create Campaign Form */}
        {showCreateForm && (
          <Card className="mb-8 bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white lowercase">create new campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-white/70 lowercase">campaign name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget" className="text-white/70 lowercase">total budget (usd) *</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="1"
                      value={formData.budget}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      required
                      className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white/70 lowercase">description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="dailyLimit" className="text-white/70 lowercase">daily limit (usd)</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      min="1"
                      value={formData.dailyLimit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, dailyLimit: e.target.value })
                      }
                      className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate" className="text-white/70 lowercase">start date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                      className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-white/70 lowercase">end date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-white text-phalo-green hover:bg-opacity-90 lowercase">create campaign</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)} className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                    cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Campaigns List */}
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white lowercase">your campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns && campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns?.map((campaign: Campaign) => (
                  <div key={campaign.id} className="p-6 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
                          <Badge className={`lowercase ${
                            campaign.status === 'active' ? 'bg-white/20 text-white' :
                            campaign.status === 'paused' ? 'bg-white/10 text-white/60' :
                            campaign.status === 'completed' ? 'bg-white/10 text-white/60' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {campaign.status}
                          </Badge>
                        </div>
                        {campaign.description && (
                          <p className="text-white/70 mb-3">{campaign.description}</p>
                        )}
                        <div className="flex items-center gap-6 text-sm text-white/60">
                          <span>budget: ${campaign.budget_total.toFixed(2)}</span>
                          <span>spent: ${campaign.budget_spent.toFixed(2)}</span>
                          <span>start: {new Date(campaign.start_date).toLocaleDateString()} - {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'ongoing'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                          edit
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                          view ads
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20 lowercase">
                          analytics
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((campaign.budget_spent / campaign.budget_total) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>${campaign.budget_spent.toFixed(2)} / ${campaign.budget_total.toFixed(2)} ({((campaign.budget_spent / campaign.budget_total) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📢</div>
                <h3 className="text-xl font-semibold text-white mb-2 lowercase">no campaigns yet</h3>
                <p className="text-white/70 mb-6 lowercase">create your first advertising campaign to start reaching developers.</p>
                <Button onClick={() => setShowCreateForm(true)} className="bg-white text-phalo-green hover:bg-opacity-90 lowercase">
                  create your first campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <style jsx global>{`
        .bg-phalo-green { background: #123c2b; }
      `}</style>
    </div>
  );
}

