import { Card } from "@/components/ui/card"
import { RepositoryWithStats } from "@/types/repository"
import Image from "next/image"

interface RepositoryListProps {
  repositories: RepositoryWithStats[]
  onRepositoryClick?: (id: string) => void
}

export function RepositoryList({ repositories, onRepositoryClick }: RepositoryListProps) {
  return (
    <div className="space-y-4">
      {repositories.map((repo) => (
        <Card
          key={repo.id}
          className="p-6 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onRepositoryClick?.(repo.id)}
        >
          <div className="flex items-start gap-4">
            <Image
              src={repo.owner.avatarUrl}
              alt={`${repo.owner.login}'s avatar`}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{repo.name}</h3>
                {repo.isPrivate && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">Private</span>
                )}
              </div>
              {repo.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {repo.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                {repo.language && (
                  <span>{repo.language}</span>
                )}
                <span>⭐ {repo.stars.toLocaleString()}</span>
                <span>🍴 {repo.forks.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                ${repo.stats.revenue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {repo.stats.views.toLocaleString()} views
              </p>
              <p className="text-xs text-muted-foreground">
                {repo.stats.clicks.toLocaleString()} clicks
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 