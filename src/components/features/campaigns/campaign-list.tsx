import { Card } from "@/components/ui/card"
import { Campaign } from "@/types/campaign"

interface CampaignListProps {
  campaigns: Campaign[]
  onCampaignClick?: (id: string) => void
}

export function CampaignList({ campaigns, onCampaignClick }: CampaignListProps) {
  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card
          key={campaign.id}
          className="p-6 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onCampaignClick?.(campaign.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{campaign.name}</h3>
              <p className="text-sm text-muted-foreground">
                Budget: ${campaign.budget} • Spent: ${campaign.spent}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {campaign.clicks.toLocaleString()} clicks
              </p>
              <p className="text-sm text-muted-foreground">
                {campaign.impressions.toLocaleString()} impressions
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 