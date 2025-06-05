'use client'

import { RepositoryList } from "@/components/features/repositories/repository-list"
import { Button } from "@/components/ui/button"
import { RepositoryWithStats } from "@/types/repository"
import { useRouter } from "next/navigation"

interface RepositoryDashboardProps {
  repositories: RepositoryWithStats[]
}

export function RepositoryDashboard({ repositories }: RepositoryDashboardProps) {
  const router = useRouter()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Repositories</h2>
          <p className="text-muted-foreground">
            Manage and monetize your GitHub repositories
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/repositories/import')}>
          Import Repository
        </Button>
      </div>

      <div className="grid gap-6">
        <RepositoryList
          repositories={repositories}
          onRepositoryClick={(id) => router.push(`/dashboard/repositories/${id}`)}
        />
      </div>
    </div>
  )
} 