'use client'

import * as Tabs from '@radix-ui/react-tabs'
import { OverviewTab } from '@/app/(protected)/projects/[id]/tabs/OverviewTab'
import { MilestonesTab } from '@/app/(protected)/projects/[id]/tabs/MilestonesTab'
import { RisksTab } from '@/app/(protected)/projects/[id]/tabs/RisksTab'
import { BudgetTab } from '@/app/(protected)/projects/[id]/tabs/BudgetTab'
import { StakeholdersTab } from '@/app/(protected)/projects/[id]/tabs/StakeholdersTab'
import { ChangeRequestsTab } from '@/app/(protected)/projects/[id]/tabs/ChangeRequestsTab'
import { ActivityLogTab } from '@/app/(protected)/projects/[id]/tabs/ActivityLogTab'

import { Project, Milestone, Risk, BudgetEntry, Stakeholder, ChangeRequest, ProjectEvent, Profile } from '@/lib/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LayoutDashboard, Calendar, AlertOctagon, DollarSign, Users, GitPullRequest, Activity } from 'lucide-react'

interface ProjectDetailTabsProps {
  project: Project
  milestones: Milestone[]
  risks: Risk[]
  budgetEntries: BudgetEntry[]
  stakeholders: Stakeholder[]
  changeRequests: ChangeRequest[]
  events: ProjectEvent[]
  profiles: Profile[]
  currentProfile: Profile
}

export function ProjectDetailTabs({
  project,
  milestones,
  risks,
  budgetEntries,
  stakeholders,
  changeRequests,
  events,
  profiles,
  currentProfile
}: ProjectDetailTabsProps) {
  
  // Count items to render badge indicators on tabs header
  const openRisksCount = risks.filter(r => r.status !== 'Closed').length
  const overdueMilestonesCount = milestones.filter(m => m.status === 'Overdue').length
  const pendingCRsCount = changeRequests.filter(cr => cr.status === 'Submitted').length

  const tabHeaders = [
    { value: 'overview', name: 'Overview', icon: LayoutDashboard },
    { value: 'milestones', name: 'Milestones', icon: Calendar, badge: overdueMilestonesCount, badgeVariant: 'destructive' },
    { value: 'risks', name: 'Risk Register', icon: AlertOctagon, badge: openRisksCount, badgeVariant: 'warning' },
    { value: 'budget', name: 'Budget', icon: DollarSign },
    { value: 'stakeholders', name: 'Stakeholders', icon: Users },
    { value: 'change-requests', name: 'Change Requests', icon: GitPullRequest, badge: pendingCRsCount, badgeVariant: 'info' },
    { value: 'activity', name: 'Activity Log', icon: Activity }
  ]

  return (
    <Tabs.Root defaultValue="overview" className="w-full space-y-6">
      
      {/* Scrollable Tabs Buttons list */}
      <Tabs.List className="flex items-center space-x-1 border-b border-border/60 overflow-x-auto pb-px flex-nowrap whitespace-nowrap scrollbar-hide">
        {tabHeaders.map((tab) => {
          const Icon = tab.icon
          return (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex items-center space-x-2 px-4 py-3 border-b-2 border-transparent text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary focus:outline-none data-[state=active]:border-primary data-[state=active]:text-primary transition-all duration-150 shrink-0 cursor-pointer"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.name}</span>
              
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold leading-none ${
                  tab.badgeVariant === 'destructive' 
                    ? 'bg-off-track/20 text-off-track'
                    : tab.badgeVariant === 'warning'
                      ? 'bg-at-risk/20 text-at-risk'
                      : 'bg-primary/20 text-primary'
                }`}>
                  {tab.badge}
                </span>
              )}
            </Tabs.Trigger>
          )
        })}
      </Tabs.List>

      {/* Tabs Content Sections */}
      <Tabs.Content value="overview" className="focus:outline-none">
        <OverviewTab project={project} currentProfile={currentProfile} profiles={profiles} />
      </Tabs.Content>

      {/* Conditionally restrict role to read-only stakeholder on archived projects */}
      {(() => {
        const tabProfile = project.health_status === 'Archived' 
          ? { ...currentProfile, role: 'stakeholder' as const } 
          : currentProfile;

        return (
          <>
            <Tabs.Content value="milestones" className="focus:outline-none">
              <MilestonesTab project={project} milestones={milestones} profiles={profiles} currentProfile={tabProfile} />
            </Tabs.Content>

            <Tabs.Content value="risks" className="focus:outline-none">
              <RisksTab project={project} risks={risks} profiles={profiles} currentProfile={tabProfile} />
            </Tabs.Content>

            <Tabs.Content value="budget" className="focus:outline-none">
              <BudgetTab project={project} budgetEntries={budgetEntries} profiles={profiles} currentProfile={tabProfile} />
            </Tabs.Content>

            <Tabs.Content value="stakeholders" className="focus:outline-none">
              <StakeholdersTab project={project} stakeholders={stakeholders} profiles={profiles} currentProfile={tabProfile} />
            </Tabs.Content>

            <Tabs.Content value="change-requests" className="focus:outline-none">
              <ChangeRequestsTab project={project} changeRequests={changeRequests} currentProfile={tabProfile} />
            </Tabs.Content>
          </>
        );
      })()}

      <Tabs.Content value="activity" className="focus:outline-none">
        <ActivityLogTab events={events} />
      </Tabs.Content>

    </Tabs.Root>
  )
}
