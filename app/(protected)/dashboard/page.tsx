import { getProjects } from '@/lib/actions/projects'
import { getOverdueMilestonesWatchlist } from '@/lib/actions/milestones'
import { getOpenRisksBySeverity } from '@/lib/actions/risks'
import { getRecentActivityFeed } from '@/lib/actions/change-requests'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [projects, overdueMilestones, openRisks, recentActivities] = await Promise.all([
    getProjects(),
    getOverdueMilestonesWatchlist(),
    getOpenRisksBySeverity(),
    getRecentActivityFeed()
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-text-primary">
          Executive Portfolio Dashboard
        </h2>
        <p className="text-xs text-text-secondary">
          Real-time governance oversight across all active enterprise projects.
        </p>
      </div>
      
      <DashboardClient
        projects={projects}
        overdueMilestones={overdueMilestones}
        openRisks={openRisks}
        recentActivities={recentActivities}
      />
    </div>
  )
}
