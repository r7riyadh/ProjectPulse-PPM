import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Briefcase, Calendar, DollarSign, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProjectById, getProjectEvents, getAllProfiles } from '@/lib/actions/projects'
import { getMilestones } from '@/lib/actions/milestones'
import { getRisks } from '@/lib/actions/risks'
import { getBudgetEntries } from '@/lib/actions/budget'
import { getStakeholders } from '@/lib/actions/stakeholders'
import { getChangeRequests } from '@/lib/actions/change-requests'
import { ProjectDetailTabs } from '@/components/projects/ProjectDetailTabs'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id: projectId } = await params

  const project = await getProjectById(projectId)
  if (!project) {
    notFound()
  }

  // Get active session
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch current profile
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profileRow) {
    redirect('/login')
  }
  
  const currentProfile = profileRow as Profile

  // Parallel fetch child arrays for all tabs
  const [
    milestones,
    risks,
    budgetEntries,
    stakeholders,
    changeRequests,
    events,
    profiles
  ] = await Promise.all([
    getMilestones(projectId),
    getRisks(projectId),
    getBudgetEntries(projectId),
    getStakeholders(projectId),
    getChangeRequests(projectId),
    getProjectEvents(projectId),
    getAllProfiles()
  ])

  return (
    <div className="space-y-6">
      
      {/* Back button */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors font-mono uppercase"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to registry</span>
        </Link>
      </div>

      {/* Project Header details */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold bg-surface-raised px-2.5 py-1 border border-border/80 rounded-md text-text-secondary">
              {project.project_number}
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <StatusBadge status={project.type} type="type" />
          </div>
          
          <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">
            {project.name}
          </h2>
          
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <StatusBadge status={project.health_status} type="health" />
            <StatusBadge status={project.phase} type="type" />
            <StatusBadge status={project.priority} type="priority" />
            <span className="text-text-muted font-mono">•</span>
            <span className="text-text-secondary">Sponsor: <span className="font-semibold text-text-primary">{project.sponsor || 'None'}</span></span>
          </div>
        </div>

        {/* Executive PM summary box */}
        <div className="p-4 rounded-xl border border-border bg-surface/50 min-w-[200px] flex items-center space-x-3 text-xs">
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
            {project.project_manager?.full_name ? project.project_manager.full_name.substring(0,2).toUpperCase() : 'PM'}
          </div>
          <div>
            <span className="text-text-muted uppercase text-[9px] font-mono">Project Lead (PM)</span>
            <p className="font-bold text-text-primary mt-0.5">{project.project_manager?.full_name || 'Unassigned'}</p>
            <p className="text-[10px] text-text-secondary mt-0.5">{project.project_manager?.department || 'IT'}</p>
          </div>
        </div>
      </div>

      {/* Project Detail Tabs Container */}
      <ProjectDetailTabs
        project={project}
        milestones={milestones}
        risks={risks}
        budgetEntries={budgetEntries}
        stakeholders={stakeholders}
        changeRequests={changeRequests}
        events={events}
        profiles={profiles}
        currentProfile={currentProfile}
      />

    </div>
  )
}
