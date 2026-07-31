'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Tag, 
  User, 
  DollarSign, 
  ShieldAlert, 
  Award, 
  Loader2, 
  ArrowRight, 
  Edit, 
  Archive, 
  Trash2, 
  Lock,
  UserCheck
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from '@/components/ui/Dialog'
import { updateProject, editProjectAction, archiveProjectAction, hardDeleteProjectAction } from '@/lib/actions/projects'
import { Project, Profile } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface OverviewTabProps {
  project: Project
  currentProfile: Profile
  profiles: Profile[]
}

const PHASES = ['Initiation', 'Planning', 'Execution', 'Monitoring', 'Closure'] as const
const TYPES = ['Infrastructure', 'Software', 'Security', 'Compliance', 'Migration', 'Other'] as const
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const

export function OverviewTab({ project, currentProfile, profiles }: OverviewTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Phase modal states
  const [tempPhase, setTempPhase] = useState<typeof PHASES[number] | ''>('')
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false)

  // Project Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [editDescription, setEditDescription] = useState(project.description || '')
  const [editSponsor, setEditSponsor] = useState(project.sponsor || '')
  const [editStartDate, setEditStartDate] = useState(project.start_date)
  const [editEndDate, setEditEndDate] = useState(project.end_date)
  const [editPriority, setEditPriority] = useState(project.priority)
  const [editType, setEditType] = useState(project.type)
  const [editPlannedBudget, setEditPlannedBudget] = useState(project.planned_budget)
  const [editProjectManagerId, setEditProjectManagerId] = useState(project.project_manager_id || '')

  // Soft Archive & Delete modal states
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const isOwner = project.project_manager_id === currentProfile.id
  const isAdmin = currentProfile.role === 'pmo_admin'
  const isPM = currentProfile.role === 'project_manager'
  const canEditOrArchive = isAdmin || (isPM && isOwner)
  const isArchived = project.health_status === 'Archived'

  // Filter possible PMs (pmo_admin or project_manager roles)
  const pmProfiles = profiles.filter(p => ['pmo_admin', 'project_manager'].includes(p.role))

  const handleHealthChange = async (newHealth: string) => {
    if (isArchived) return
    setLoading(true)
    try {
      await updateProject(project.id, { health_status: newHealth as any })
      toast.success(`Project health updated to ${newHealth}`)
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to update health: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const triggerPhaseChange = (phaseName: typeof PHASES[number]) => {
    if (isArchived) return
    setTempPhase(phaseName)
    setIsPhaseModalOpen(true)
  }

  const confirmPhaseChange = async () => {
    if (!tempPhase || isArchived) return
    setLoading(true)
    setIsPhaseModalOpen(false)
    try {
      await updateProject(project.id, { phase: tempPhase })
      toast.success(`Project phase advanced to ${tempPhase}`)
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to update phase: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await editProjectAction(project.id, {
        name: editName,
        description: editDescription,
        sponsor: editSponsor,
        start_date: editStartDate,
        end_date: editEndDate,
        priority: editPriority as any,
        type: editType as any,
        planned_budget: Number(editPlannedBudget),
        project_manager_id: editProjectManagerId || null
      })
      toast.success('Project updated successfully')
      setIsEditModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(`Edit failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveSubmit = async () => {
    setLoading(true)
    try {
      await archiveProjectAction(project.id)
      toast.success('Project soft-archived successfully')
      setIsArchiveModalOpen(false)
      router.push('/projects')
    } catch (err: any) {
      toast.error(`Archive failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleHardDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (deleteConfirmName !== project.name) {
      toast.error('Project name mismatch. Confirmation failed.')
      return
    }

    setLoading(true)
    try {
      await hardDeleteProjectAction(project.id)
      toast.success(`Project "${project.name}" permanently deleted`)
      setIsDeleteModalOpen(false)
      router.push('/projects')
    } catch (err: any) {
      toast.error(`Deletion failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const currentPhaseIndex = PHASES.indexOf(project.phase as any)

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 1. Phase Gate Progress Bar */}
      <Card className="glass-panel p-6">
        <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-4">
          Project Phase Gates Gatekeepers
        </h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          
          {/* Connector Line for Desktop */}
          <div className="absolute left-[8%] right-[8%] top-[18px] h-[2px] bg-border/40 hidden md:block z-0" />
          
          {PHASES.map((p, idx) => {
            const isCompleted = idx < currentPhaseIndex
            const isCurrent = idx === currentPhaseIndex
            const isFuture = idx > currentPhaseIndex
            
            return (
              <div 
                key={p} 
                className="flex-1 flex md:flex-col items-center gap-3 md:gap-2 relative z-10 text-left md:text-center"
              >
                <div 
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-mono text-sm font-bold border transition-all duration-300 shadow ${
                    isCompleted 
                      ? 'bg-primary/20 border-primary text-primary text-glow-primary' 
                      : isCurrent
                        ? 'bg-primary border-primary text-white scale-115 shadow-md shadow-primary/30'
                        : 'bg-surface border-border text-text-muted'
                  }`}
                >
                  {idx + 1}
                </div>

                <div className="flex flex-col">
                  <span className={`text-xs font-bold transition-colors ${isCurrent ? 'text-primary' : isFuture ? 'text-text-muted' : 'text-text-primary'}`}>
                    {p}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono uppercase">
                    {isCurrent ? 'Active' : isCompleted ? 'Passed' : 'Pending'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 2. Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Overview & Scope</CardTitle>
            <CardDescription>Target deliverables and context metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed bg-surface/50 border border-border/40 p-4 rounded-xl">
              {project.description || 'No project description logged.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              <div className="flex items-center space-x-3 text-xs">
                <Tag className="h-4 w-4 text-text-muted" />
                <div className="flex flex-col">
                  <span className="text-text-muted font-mono uppercase text-[10px]">Project Type</span>
                  <span className="text-text-primary font-bold">{project.type}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <User className="h-4 w-4 text-text-muted" />
                <div className="flex flex-col">
                  <span className="text-text-muted font-mono uppercase text-[10px]">Project Sponsor</span>
                  <span className="text-text-primary font-bold">{project.sponsor || 'Unspecified'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <Calendar className="h-4 w-4 text-text-muted" />
                <div className="flex flex-col">
                  <span className="text-text-muted font-mono uppercase text-[10px]">Timeline Timeframe</span>
                  <span className="text-text-primary font-bold font-mono">
                    {formatDate(project.start_date)} — {formatDate(project.end_date)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <Award className="h-4 w-4 text-text-muted" />
                <div className="flex flex-col">
                  <span className="text-text-muted font-mono uppercase text-[10px]">Project Manager</span>
                  <span className="text-text-primary font-bold">
                    {project.project_manager?.full_name || 'Unassigned'} ({project.project_manager?.department || 'IT'})
                  </span>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Change Actions Panel */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Governance Settings</CardTitle>
            <CardDescription>Authorize project phase gate transitions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            
            {isArchived ? (
              <div className="p-4 rounded-xl border border-border bg-surface-raised flex flex-col items-center justify-center text-center space-y-2">
                <Lock className="h-6 w-6 text-text-muted" />
                <h4 className="text-xs font-bold text-text-primary uppercase font-mono tracking-wider">Archived State</h4>
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  This project is archived and read-only. Health states, phase gates, and budget parameters cannot be updated.
                </p>
              </div>
            ) : (
              <>
                {/* Health dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Project Health Status</label>
                  <select
                    disabled={loading || !canEditOrArchive}
                    value={project.health_status}
                    onChange={(e) => handleHealthChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-raised text-xs text-text-primary focus:outline-none focus:border-primary disabled:opacity-50 transition-all cursor-pointer font-semibold"
                  >
                    <option value="On Track">🟢 On Track</option>
                    <option value="At Risk">🟡 At Risk</option>
                    <option value="Off Track">🔴 Off Track</option>
                    <option value="Completed">🔵 Completed</option>
                    <option value="On Hold">🟣 On Hold</option>
                  </select>
                </div>

                {/* Phase Advancement dropdown */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Phase Gate Shift</label>
                  <select
                    disabled={loading || !canEditOrArchive}
                    value={project.phase}
                    onChange={(e) => triggerPhaseChange(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-raised text-xs text-text-primary focus:outline-none focus:border-primary disabled:opacity-50 transition-all cursor-pointer font-semibold"
                  >
                    {PHASES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Edit & Archive Actions (PM/Admin) */}
                {canEditOrArchive && (
                  <div className="pt-4 border-t border-border/40 space-y-2">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-hover text-white py-2 px-3 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all shadow-sm cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit Project</span>
                    </button>

                    <button
                      onClick={() => setIsArchiveModalOpen(true)}
                      className="w-full flex items-center justify-center space-x-2 border border-off-track/40 hover:bg-off-track/5 text-off-track py-2 px-3 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all cursor-pointer"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>Archive Project</span>
                    </button>
                  </div>
                )}

                {/* Hard Delete Action (Admin Only) */}
                {isAdmin && (
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-off-track hover:bg-off-track/90 text-white py-2 px-3 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all shadow-md cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Project</span>
                  </button>
                )}
              </>
            )}

            {!isArchived && !canEditOrArchive && (
              <div className="mt-4 p-3 rounded-lg bg-surface border border-border/60 flex items-center space-x-2 text-[10px] text-text-muted">
                <ShieldAlert className="h-4 w-4 text-at-risk" />
                <span>Modifications locked (Admins/Project Owner only).</span>
              </div>
            )}

          </CardContent>
        </Card>

      </div>

      {/* 3. Phase Advance Confirmation Safety Modal */}
      <Dialog open={isPhaseModalOpen} onOpenChange={setIsPhaseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 text-at-risk" />
              <span>Confirm Phase Gate Shift</span>
            </DialogTitle>
            <DialogDescription>
              You are shifting this project's governance phase gate.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-sm text-text-secondary">
            Are you sure you want to transition the project phase from <span className="font-bold text-text-primary">"{project.phase}"</span> to <span className="font-bold text-primary">"{tempPhase}"</span>? This operation will append a permanent record to the audit trail feed.
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <DialogClose asChild>
              <button className="px-4 py-2 border border-border bg-surface hover:bg-surface-raised rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors cursor-pointer">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={confirmPhaseChange}
              disabled={loading}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all flex items-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span>Confirm Transition</span>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Edit Project Form Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project details</DialogTitle>
            <DialogDescription>
              Update properties below. Depending on roles, some metrics may be restricted.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">Project Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">Description *</label>
              <textarea
                required
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">Project Type *</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">Priority *</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">Project Sponsor *</label>
              <input
                type="text"
                required
                value={editSponsor}
                onChange={(e) => setEditSponsor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">Start Date *</label>
                <input
                  type="date"
                  required
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">End Date *</label>
                <input
                  type="date"
                  required
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* PMO Admin Exclusive Fields */}
            {isAdmin ? (
              <div className="pt-4 border-t border-border bg-surface-raised/40 p-3 rounded-lg space-y-4">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-primary uppercase tracking-widest block font-bold">Planned Budget ($) * (Admin Only)</label>
                  <input
                    type="number"
                    required
                    value={editPlannedBudget}
                    onChange={(e) => setEditPlannedBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-primary uppercase tracking-widest block font-bold">Assign Project Lead * (Admin Only)</label>
                  <select
                    value={editProjectManagerId}
                    onChange={(e) => setEditProjectManagerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Unassigned</option>
                    {pmProfiles.map(pm => (
                      <option key={pm.id} value={pm.id}>
                        {pm.full_name} ({pm.role === 'pmo_admin' ? 'PMO Admin' : 'Project Manager'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-surface-raised rounded-lg border border-border/50 text-[10px] text-text-muted flex items-start space-x-1.5">
                <Lock className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
                <span>Planned Budget and Project Manager assignments are locked. Contact a PMO Admin to modify these fields.</span>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-border/40 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-border bg-surface hover:bg-surface-raised rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Soft Archive Confirmation Modal */}
      <Dialog open={isArchiveModalOpen} onOpenChange={setIsArchiveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-off-track">
              <ShieldAlert className="h-5 w-5" />
              <span>Soft-Archive Project?</span>
            </DialogTitle>
            <DialogDescription>
              Archive this project? It will be hidden from the main registry but all database records will be preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-sm text-text-secondary leading-relaxed">
            Archiving moves this project into a read-only historical catalog. Its actual expenditures rollup, milestone tracking, and audit trail events will remain intact, but active updates will be disabled.
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <button
              onClick={() => setIsArchiveModalOpen(false)}
              className="px-4 py-2 border border-border bg-surface hover:bg-surface-raised rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleArchiveSubmit}
              disabled={loading}
              className="bg-off-track hover:bg-off-track/90 text-white px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all flex items-center space-x-2 cursor-pointer shadow-md"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5" />
                  <span>Confirm Archive</span>
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Danger Hard Delete Modal (Admin Only) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-off-track">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
              <span>Permanently Delete Project</span>
            </DialogTitle>
            <DialogDescription>
              Warning: This action is irreversible. All related records will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleHardDeleteSubmit} className="space-y-4">
            <div className="p-3.5 rounded-lg border border-off-track/30 bg-off-track/5 text-xs text-off-track leading-relaxed space-y-1">
              <p className="font-bold">⚠️ CRITICAL WARNING BANNER:</p>
              <p>This action cannot be undone. All milestones, risks, budget entries, stakeholders, change requests, and activity logs will be permanently deleted.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-text-secondary font-mono uppercase tracking-wider">
                Type <span className="font-bold text-text-primary">"{project.name}"</span> to confirm deletion:
              </label>
              <input
                type="text"
                required
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Type project name exactly..."
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-off-track font-bold transition-all"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/40 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setDeleteConfirmName('')
                }}
                className="px-4 py-2 border border-border bg-surface hover:bg-surface-raised rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || deleteConfirmName !== project.name}
                className="bg-off-track hover:bg-off-track/90 text-white px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
