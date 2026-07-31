'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Plus, Trash2, HelpCircle, Users, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/Dialog'
import { createStakeholder, deleteStakeholder } from '@/lib/actions/stakeholders'
import { Project, Stakeholder, Profile } from '@/lib/types'
import { toast } from 'sonner'

interface StakeholdersTabProps {
  project: Project
  stakeholders: Stakeholder[]
  profiles: Profile[]
  currentProfile: Profile
}

export function StakeholdersTab({ project, stakeholders, profiles, currentProfile }: StakeholdersTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form fields
  const [userId, setUserId] = useState('')
  const [raciRole, setRaciRole] = useState<'Responsible' | 'Accountable' | 'Consulted' | 'Informed'>('Consulted')
  const [notes, setNotes] = useState('')

  const isManagerOrAdmin = ['pmo_admin', 'project_manager'].includes(currentProfile.role)
  const isAdmin = currentProfile.role === 'pmo_admin'

  // Filter profiles to exclude users who are already stakeholders
  const availableProfiles = profiles.filter(
    (p) => !stakeholders.some((s) => s.user_id === p.id)
  )

  const handleAddStakeholder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !raciRole) {
      toast.error('User and RACI role are required fields.')
      return
    }

    setLoading(true)
    try {
      await createStakeholder({
        project_id: project.id,
        user_id: userId,
        raci_role: raciRole,
        notes
      })
      toast.success('Stakeholder added to RACI matrix!')
      setIsAddOpen(false)
      setUserId('')
      setNotes('')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to add stakeholder: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStakeholder = async (stakeholderId: string) => {
    if (!confirm('Are you sure you want to remove this stakeholder from the RACI matrix?')) return
    setLoading(true)
    try {
      await deleteStakeholder(stakeholderId, project.id)
      toast.success('Stakeholder removed from matrix.')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to delete stakeholder: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 1. RACI Matrix Guidelines Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>RACI Governance Framework</CardTitle>
            <CardDescription>Visual mapping of roles, accountability, and communication flow.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-text-secondary">
            <div className="p-3 border border-border bg-surface/50 rounded-lg">
              <StatusBadge status="Responsible" type="raci" className="mb-1.5" />
              <p>Execute actual migration scripts, logs audits, and runs deployment checklists.</p>
            </div>
            <div className="p-3 border border-border bg-surface/50 rounded-lg">
              <StatusBadge status="Accountable" type="raci" className="mb-1.5" />
              <p>Overall decision authority owner. Ultimately sign off deliverables phase transitions.</p>
            </div>
            <div className="p-3 border border-border bg-surface/50 rounded-lg">
              <StatusBadge status="Consulted" type="raci" className="mb-1.5" />
              <p>Key technical specialists consulted for reviews before final cuts are made.</p>
            </div>
            <div className="p-3 border border-border bg-surface/50 rounded-lg">
              <StatusBadge status="Informed" type="raci" className="mb-1.5" />
              <p>Informed about status gates and updates passively via brief feeds.</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Stakeholder Panel</CardTitle>
            <CardDescription>RACI role assignments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <p className="text-xs text-text-secondary leading-relaxed">
              Define stakeholders to satisfy RLS row access matrices. Stakeholder users get assigned read-only project registry visibility.
            </p>
            {isManagerOrAdmin ? (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <button className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all shadow cursor-pointer flex items-center justify-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Stakeholder</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddStakeholder}>
                    <DialogHeader>
                      <DialogTitle>Add Stakeholder to RACI</DialogTitle>
                      <DialogDescription>Select active profile, assign RACI role, and log guidelines.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-xs">
                      
                      <div className="space-y-1">
                        <label className="font-mono uppercase text-text-secondary">Select User Profile *</label>
                        <select
                          required
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
                        >
                          <option value="">-- Choose Profile --</option>
                          {availableProfiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.full_name} ({p.role} - {p.department})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-mono uppercase text-text-secondary">RACI Role Asserted *</label>
                        <select
                          value={raciRole}
                          onChange={(e) => setRaciRole(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
                        >
                          <option value="Responsible">Responsible (Doer)</option>
                          <option value="Accountable">Accountable (Owner)</option>
                          <option value="Consulted">Consulted (Specialist)</option>
                          <option value="Informed">Informed (Observer)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-mono uppercase text-text-secondary">Custom Notes</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="What specific tasks are assigned or expected..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-xs resize-none"
                        />
                      </div>

                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <button className="px-4 py-2 border border-border bg-surface hover:bg-surface-raised text-xs text-text-secondary rounded-lg transition-colors cursor-pointer">
                          Cancel
                        </button>
                      </DialogClose>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Add Stakeholder</span>}
                      </button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="p-3 bg-surface border border-border/60 rounded-lg text-[10px] text-text-muted flex items-center space-x-2">
                <Shield className="h-4 w-4 text-at-risk" />
                <span>Modification restricted (PM/Admins only).</span>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* 2. Stakeholders Registry List */}
      <Card className="glass-panel p-0 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50 text-text-muted font-mono uppercase text-[10px]">
                <th className="p-4">Name / Department</th>
                <th className="p-4">Email</th>
                <th className="p-4">RACI Role</th>
                <th className="p-4">Custom Notes</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {stakeholders.map((s) => (
                <tr key={s.id} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-text-primary block">{s.profile?.full_name || 'System Member'}</span>
                    <span className="text-[10px] text-text-muted mt-0.5">{s.profile?.department || 'IT'}</span>
                  </td>
                  <td className="p-4 text-text-muted font-mono">{s.profile?.email || '—'}</td>
                  <td className="p-4">
                    <StatusBadge status={s.raci_role} type="raci" />
                  </td>
                  <td className="p-4 text-text-secondary max-w-[250px] leading-relaxed">
                    {s.notes || '—'}
                  </td>
                  <td className="p-4 text-center">
                    {isAdmin ? (
                      <button
                        onClick={() => handleDeleteStakeholder(s.id)}
                        disabled={loading}
                        className="p-1.5 rounded hover:bg-surface hover:text-off-track border border-transparent hover:border-border text-text-muted transition-colors cursor-pointer"
                        title="Remove Stakeholder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-text-muted font-mono">
                        {isManagerOrAdmin ? 'ADMIN ONLY' : 'LOCKED'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {stakeholders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted font-medium font-sans">
                    No stakeholders registered in the RACI matrix yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  )
}
