import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AdPlacement } from "@/types/intelligent-ads"
import { Button } from "@/components/ui/button"

interface AdPlacementCardProps {
  placement: AdPlacement
  onEdit?: (id: string) => void
  onStatusChange?: (id: string, status: AdPlacement['status']) => void
}

const typeColors = {
  banner: "bg-blue-100 text-blue-800",
  inline: "bg-purple-100 text-purple-800",
  sidebar: "bg-green-100 text-green-800"
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800"
}

export function AdPlacementCard({
  placement,
  onEdit,
  onStatusChange
}: AdPlacementCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={typeColors[placement.type]}>
              {placement.type}
            </Badge>
            <Badge variant="outline" className={statusColors[placement.status]}>
              {placement.status}
            </Badge>
          </div>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            {placement.location}
          </p>
          <p className="mt-1 line-clamp-2">
            {placement.content}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(placement.id)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.(
              placement.id,
              placement.status === 'active' ? 'paused' : 'active'
            )}
          >
            {placement.status === 'active' ? 'Pause' : 'Activate'}
          </Button>
        </div>
      </div>
      {placement.performance && (
        <div className="mt-4 grid grid-cols-4 gap-4 border-t pt-4">
          <div>
            <p className="text-sm font-medium">Views</p>
            <p className="text-2xl font-semibold">
              {placement.performance.views.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Clicks</p>
            <p className="text-2xl font-semibold">
              {placement.performance.clicks.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Conversions</p>
            <p className="text-2xl font-semibold">
              {placement.performance.conversions.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Revenue</p>
            <p className="text-2xl font-semibold">
              ${placement.performance.revenue.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
} 