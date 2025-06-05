'use client'

import { CampaignList } from "@/components/features/campaigns/campaign-list"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Campaign } from "@/types/campaign"

interface CampaignDashboardProps {
  campaigns: Campaign[]
}

export function CampaignDashboard({ campaigns }: CampaignDashboardProps) {
  const router = useRouter()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Campaigns</h2>
          <p className="text-muted-foreground">
            Manage and monitor your advertising campaigns
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/campaigns/new')}>
          Create Campaign
        </Button>
      </div>

      <div className="grid gap-6">
        <CampaignList
          campaigns={campaigns}
          onCampaignClick={(id) => router.push(`/dashboard/campaigns/${id}`)}
        />
      </div>
    </div>
  )
} 