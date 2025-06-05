'use client'

import { AdPlacementCard } from "@/components/features/intelligent-ads/ad-placement-card"
import { Button } from "@/components/ui/button"
import { AdPlacement } from "@/types/intelligent-ads"
import { useRouter } from "next/navigation"

interface IntelligentAdsDashboardProps {
  placements: AdPlacement[]
}

export function IntelligentAdsDashboard({ placements }: IntelligentAdsDashboardProps) {
  const router = useRouter()

  const handleStatusChange = async (id: string, status: AdPlacement['status']) => {
    // TODO: Implement status change
    console.log('Status change:', id, status)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Intelligent Ads</h2>
          <p className="text-muted-foreground">
            Optimize your ad placements with AI-powered suggestions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/intelligent-ads/analyze')}
          >
            Analyze Repository
          </Button>
          <Button
            onClick={() => router.push('/dashboard/intelligent-ads/create')}
          >
            Create Placement
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {placements.map((placement) => (
          <AdPlacementCard
            key={placement.id}
            placement={placement}
            onEdit={(id) => router.push(`/dashboard/intelligent-ads/${id}`)}
            onStatusChange={handleStatusChange}
          />
        ))}
        {placements.length === 0 && (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-lg font-semibold">No Ad Placements Yet</h3>
            <p className="text-muted-foreground mt-1">
              Get started by analyzing your repository or creating a placement manually
            </p>
            <div className="mt-4 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/intelligent-ads/analyze')}
              >
                Analyze Repository
              </Button>
              <Button
                onClick={() => router.push('/dashboard/intelligent-ads/create')}
              >
                Create Placement
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 