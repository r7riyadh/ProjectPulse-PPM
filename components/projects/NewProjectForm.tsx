'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { createProject } from '@/lib/actions/projects'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Profile } from '@/lib/types'
import { toast } from 'sonner'

interface NewProjectFormProps {
  projectManagers: Profile[]
}

export function NewProjectForm({ projectManagers }: NewProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('Software')
  const [phase, setPhase] = useState('Initiation')
  const [healthStatus, setHealthStatus] = useState('On Track')
  const [priority, setPriority] = useState('Medium')
  const [sponsor, setSponsor] = useState('')
  const [projectManagerId, setProjectManagerId] = useState('')
  const [plannedBudget, setPlannedBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !plannedBudget || !startDate || !endDate || !projectManagerId) {
      toast.error('Please fill in all required fields.')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) {
      toast.error('The Project End Date cannot be before the Start Date.')
      return
    }

    setLoading(true)
    try {
      await createProject({
        name,
        description,
        type,
        phase,
        health_status: healthStatus,
        priority,
        sponsor,
        project_manager_id: projectManagerId,
        planned_budget: Number(plannedBudget),
        start_date: startDate,
        end_date: endDate
      })

      toast.success('Project successfully created & event logged!')
      router.push('/projects')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to create project: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
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

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Save className="h-5 w-5 text-primary" />
            <CardTitle>Initialize New IT Project</CardTitle>
          </div>
          <CardDescription>
            Specify budget parameters, timeline assertions, and assign an active Project Manager.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Project Name */}
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Project Name <span className="text-off-track">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ERP Cloud S/4HANA Migration"
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Detailed Scope Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Document deliverables, target integrations, assets scope..."
                disabled={loading}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-sm resize-none"
              />
            </div>

            {/* 2x2 Field Row: Type, Phase, Health, Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Type Selection */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Project Type <span className="text-off-track">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-sm"
                >
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Software">Software</option>
                  <option value="Security">Security</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Migration">Migration</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Initial Phase */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Current Phase Gate <span className="text-off-track">*</span>
                </label>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-sm"
                >
                  <option value="Initiation">Initiation</option>
                  <option value="Planning">Planning</option>
                  <option value="Execution">Execution</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Closure">Closure</option>
                </select>
              </div>

              {/* Initial Health */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Initial Health Status <span className="text-off-track">*</span>
                </label>
                <select
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-sm"
                >
                  <option value="On Track">On Track</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Off Track">Off Track</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Project Priority <span className="text-off-track">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

            </div>

            {/* Sponsor & PM Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Executive Sponsor */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Executive Sponsor
                </label>
                <input
                  type="text"
                  value={sponsor}
                  onChange={(e) => setSponsor(e.target.value)}
                  placeholder="e.g. CISO, VP of HR, Chief Auditor"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-sm"
                />
              </div>

              {/* Assign PM */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Assigned Project Manager (PM) <span className="text-off-track">*</span>
                </label>
                <select
                  required
                  value={projectManagerId}
                  onChange={(e) => setProjectManagerId(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-sm"
                >
                  <option value="">-- Select Project Manager --</option>
                  {projectManagers.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.full_name} ({pm.department || 'IT'})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Financial & Timeframe Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Planned Budget */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Planned Budget (USD) <span className="text-off-track">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={plannedBudget}
                  onChange={(e) => setPlannedBudget(e.target.value)}
                  placeholder="e.g. 150000"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-sm font-mono"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Start Date <span className="text-off-track">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-sm font-mono"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  End Date <span className="text-off-track">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-sm font-mono"
                />
              </div>

            </div>

            {/* Actions Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border/40">
              <Link
                href="/projects"
                className="px-4 py-2.5 border border-border hover:bg-surface text-text-secondary hover:text-text-primary font-semibold text-sm rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Initialize Project</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </CardContent>
      </Card>

    </div>
  )
}
