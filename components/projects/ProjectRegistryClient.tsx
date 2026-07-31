'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Briefcase, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardContent } from '@/components/ui/Card'
import { Project, Profile } from '@/lib/types'

interface ProjectRegistryClientProps {
  projects: Project[]
  currentProfile: Profile
}

export function ProjectRegistryClient({ projects, currentProfile }: ProjectRegistryClientProps) {
  const router = useRouter()
  
  // States for search and filtering
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('')
  const [healthFilter, setHealthFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  // Filter project arrays
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.project_number.toLowerCase().includes(search.toLowerCase()) ||
                          (p.project_manager?.full_name || '').toLowerCase().includes(search.toLowerCase())
    
    const matchesType = typeFilter ? p.type === typeFilter : true
    const matchesPhase = phaseFilter ? p.phase === phaseFilter : true
    const matchesHealth = healthFilter ? p.health_status === healthFilter : true
    const matchesPriority = priorityFilter ? p.priority === priorityFilter : true
    const matchesArchived = showArchived ? true : p.health_status !== 'Archived'

    return matchesSearch && matchesType && matchesPhase && matchesHealth && matchesPriority && matchesArchived
  })

  const canCreate = ['pmo_admin', 'project_manager'].includes(currentProfile.role)

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('')
    setPhaseFilter('')
    setHealthFilter('')
    setPriorityFilter('')
    setShowArchived(false)
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-text-primary">
            Project Registry
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Query, manage, and audit all active project profiles.
          </p>
        </div>
        
        {canCreate && (
          <Link
            href="/projects/new"
            className="inline-flex items-center space-x-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Link>
        )}
      </div>

      {/* 2. Filters Grid Panel */}
      <Card className="glass-panel p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          
          {/* Search Box */}
          <div className="space-y-1 lg:col-span-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Search Projects</label>
              <label className="inline-flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border bg-surface-raised text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-[9px] font-mono text-text-secondary uppercase select-none">Show Archived</span>
              </label>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, manager or PRJ#..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface-raised text-xs text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted transition-all"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-xs text-text-primary focus:outline-none focus:border-primary transition-all"
            >
              <option value="">All Types</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Software">Software</option>
              <option value="Security">Security</option>
              <option value="Compliance">Compliance</option>
              <option value="Migration">Migration</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Phase Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Phase</label>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-xs text-text-primary focus:outline-none focus:border-primary transition-all"
            >
              <option value="">All Phases</option>
              <option value="Initiation">Initiation</option>
              <option value="Planning">Planning</option>
              <option value="Execution">Execution</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Closure">Closure</option>
            </select>
          </div>

          {/* Health Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Health</label>
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-xs text-text-primary focus:outline-none focus:border-primary transition-all"
            >
              <option value="">All Health</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Off Track">Off Track</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Priority / Clear filters */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-border bg-surface-raised text-xs text-text-primary focus:outline-none focus:border-primary transition-all"
              >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <button
              onClick={clearFilters}
              className="px-2 py-2 border border-border bg-surface hover:bg-surface-raised text-[10px] font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary rounded-lg transition-colors cursor-pointer flex items-center justify-center self-end h-[34px]"
              title="Reset Filters"
            >
              Clear
            </button>
          </div>

        </div>
      </Card>

      {/* 3. Projects Table */}
      <Card className="glass-panel p-0 overflow-hidden">
        {filteredProjects.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left text-xs min-w-[950px]">
              <thead>
                <tr className="border-b border-border/60 bg-surface/50 text-text-muted font-mono uppercase text-[10px]">
                  <th className="p-4">Project ID</th>
                  <th className="p-4">Project Details</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Phase</th>
                  <th className="p-4">Health</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Project Manager</th>
                  <th className="p-4">Budget / Spend</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredProjects.map((p) => {
                  const consumedPercent = p.planned_budget > 0 ? (p.actual_spend / p.planned_budget) * 100 : 0
                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/projects/${p.id}`)}
                      className="hover:bg-surface-raised/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-mono text-text-secondary font-bold group-hover:text-primary transition-colors">
                        {p.project_number}
                      </td>
                      <td className="p-4 max-w-[200px]">
                        <span className="font-bold text-text-primary block truncate">{p.name}</span>
                        <span className="text-[10px] text-text-muted block truncate mt-0.5">
                          Sponsor: {p.sponsor || 'None'}
                        </span>
                      </td>
                      <td className="p-4 text-text-secondary">{p.type}</td>
                      <td className="p-4">
                        <span className="font-semibold text-text-primary">{p.phase}</span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={p.health_status} type="health" />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={p.priority} type="priority" />
                      </td>
                      <td className="p-4 text-text-secondary">
                        {p.project_manager?.full_name || 'Unassigned'}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col space-y-1">
                          <span className="font-semibold text-text-primary">
                            {formatCurrency(p.actual_spend)} / {formatCurrency(p.planned_budget)}
                          </span>
                          <div className="w-24 bg-border/40 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${consumedPercent > 100 ? 'bg-off-track' : 'bg-primary'}`}
                              style={{ width: `${Math.min(consumedPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-text-muted font-mono">{formatDate(p.end_date)}</td>
                      <td className="p-4 text-center">
                        <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all inline" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-text-secondary flex flex-col items-center justify-center">
            <Briefcase className="h-10 w-10 text-text-muted mb-3" />
            <span className="font-bold text-text-primary text-sm">No Projects Found</span>
            <p className="text-xs text-text-muted max-w-sm mt-1">
              No project records match your currently selected filters. Modify your search queries to see listings.
            </p>
          </div>
        )}
      </Card>

    </div>
  )
}
