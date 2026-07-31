'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitPullRequest, Plus, HelpCircle, ShieldCheck, Eye, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/Dialog'
import { createChangeRequest, reviewChangeRequest } from '@/lib/actions/change-requests'
import { Project, ChangeRequest, Profile } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface ChangeRequestsTabProps {
  project: Project
  changeRequests: ChangeRequest[]
  currentProfile: Profile
}

export function ChangeRequestsTab({ project, changeRequests, currentProfile }: ChangeRequestsTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null)
  
  // Submit Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [changeType, setChangeType] = useState('Scope')
  const [impactSummary, setImpactSummary] = useState('')

  // Review states
  const [reviewNotes, setReviewNotes] = useState('')

  const isManagerOrAdmin = ['pmo_admin', 'project_manager'].includes(currentProfile.role)

  const handleSubmitCR = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description) {
      toast.error('Title and Scope description are required.')
      return
    }

    setLoading(true)
    try {
      await createChangeRequest({
        project_id: project.id,
        title,
        description,
        change_type: changeType,
        impact_summary: impactSummary
      })
      toast.success('Change request submitted for PM review!')
      setIsSubmitOpen(false)
      setTitle('')
      setDescription('')
      setImpactSummary('')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to submit change request: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewAction = async (status: 'Approved' | 'Rejected') => {
    if (!selectedCR) return
    setLoading(true)
    try {
      await reviewChangeRequest(selectedCR.id, project.id, status, reviewNotes)
      toast.success(`Change Request ${selectedCR.cr_number} was ${status.toLowerCase()}!`)
      setIsReviewOpen(false)
      setSelectedCR(null)
      setReviewNotes('')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to review change request: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const triggerReview = (cr: ChangeRequest) => {
    setSelectedCR(cr)
    setReviewNotes('')
    setIsReviewOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 1. Header & Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Project Change Logs</h3>
          <p className="text-[10px] text-text-muted">Review scope adjustments, budget extensions, and timeline extensions.</p>
        </div>
        <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              <span>Submit CR</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmitCR}>
              <DialogHeader>
                <DialogTitle>Submit Change Request (CR)</DialogTitle>
                <DialogDescription>Describe target scope adjustments and resource requirements.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 text-xs">
                
                <div className="space-y-1">
                  <label className="font-mono uppercase text-text-secondary">CR Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Budget increase for custom DB migration consult"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono uppercase text-text-secondary">Adjusted Parameter Type</label>
                  <select
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
                  >
                    <option value="Scope">Scope</option>
                    <option value="Budget">Budget</option>
                    <option value="Timeline">Timeline</option>
                    <option value="Resource">Resource</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono uppercase text-text-secondary">Scope Adjustment Description *</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detail specific alterations, reasonings, logs..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-xs resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono uppercase text-text-secondary">Timeline / Budget Impact Summary</label>
                  <textarea
                    value={impactSummary}
                    onChange={(e) => setImpactSummary(e.target.value)}
                    placeholder="Describe impact on end dates, licensing cost rollups..."
                    rows={2}
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
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Submit CR</span>}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 2. Change Requests Registry Grid Table */}
      <Card className="glass-panel p-0 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-xs min-w-[750px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50 text-text-muted font-mono uppercase text-[10px]">
                <th className="p-4">CR Number</th>
                <th className="p-4">Change Title</th>
                <th className="p-4">Parameter Type</th>
                <th className="p-4">Requested By</th>
                <th className="p-4">Submit Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {changeRequests.map((cr) => (
                <tr key={cr.id} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-text-primary">{cr.cr_number}</td>
                  <td className="p-4 max-w-[200px]">
                    <span className="font-bold text-text-primary block line-clamp-1">{cr.title}</span>
                    <span className="text-[10px] text-text-muted line-clamp-1 mt-0.5">{cr.description}</span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={cr.change_type} type="type" />
                  </td>
                  <td className="p-4 text-text-secondary">{cr.requester?.full_name || 'System User'}</td>
                  <td className="p-4 font-mono text-text-muted">{formatDate(cr.created_at)}</td>
                  <td className="p-4">
                    <StatusBadge status={cr.status} type="cr-status" />
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => triggerReview(cr)}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-surface-raised hover:bg-surface border border-border hover:border-primary/50 text-text-secondary hover:text-text-primary transition-all rounded font-semibold text-[10px] cursor-pointer"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View / Review</span>
                    </button>
                  </td>
                </tr>
              ))}
              {changeRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted font-medium">
                    No change requests submitted for this project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Review Modal Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <GitPullRequest className="h-5 w-5 text-primary" />
              <span>Review Change Request: {selectedCR?.cr_number}</span>
            </DialogTitle>
            <DialogDescription>
              Check scope parameters, target schedules, and approve or reject this proposal.
            </DialogDescription>
          </DialogHeader>

          {selectedCR && (
            <div className="space-y-4 py-4 text-xs border-y border-border/40">
              <div className="grid grid-cols-2 gap-4 font-mono">
                <div>
                  <span className="text-text-muted block text-[9px] uppercase">Submitter</span>
                  <span className="text-text-primary font-bold text-xs">{selectedCR.requester?.full_name}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[9px] uppercase">Parameter Adjusted</span>
                  <span className="text-text-primary font-bold text-xs">{selectedCR.change_type}</span>
                </div>
              </div>

              <div>
                <span className="text-text-muted block text-[9px] uppercase font-mono mb-1">Proposal Scope Details</span>
                <p className="bg-surface/60 border border-border/40 p-3 rounded-lg text-text-secondary leading-relaxed">
                  {selectedCR.description}
                </p>
              </div>

              <div>
                <span className="text-text-muted block text-[9px] uppercase font-mono mb-1">Impact Assertions Summary</span>
                <p className="bg-surface/40 border border-border/30 p-2.5 rounded-lg text-text-muted italic">
                  {selectedCR.impact_summary || 'No impact assertions provided.'}
                </p>
              </div>

              {selectedCR.status !== 'Submitted' && (
                <div className="p-3 bg-surface-raised border border-border rounded-lg grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-text-muted font-mono block text-[9px]">Reviewer</span>
                    <span className="font-bold text-text-primary">{selectedCR.reviewer?.full_name || 'System Administrator'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted font-mono block text-[9px]">Review Decision Date</span>
                    <span className="font-bold font-mono text-text-primary">{formatDate(selectedCR.reviewed_at || '')}</span>
                  </div>
                </div>
              )}

              {/* Approval controls for PMs and Admins */}
              {selectedCR.status === 'Submitted' && isManagerOrAdmin && (
                <div className="space-y-1.5 pt-2">
                  <label className="font-mono uppercase text-text-secondary">Approval / Rejection Decision Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Log audit comments, reasonings, budget shifts details..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-xs resize-none"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between w-full">
            <DialogClose asChild>
              <button className="px-4 py-2 border border-border bg-surface hover:bg-surface-raised text-xs text-text-secondary rounded-lg transition-colors cursor-pointer">
                Close
              </button>
            </DialogClose>
            
            {selectedCR?.status === 'Submitted' && isManagerOrAdmin && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleReviewAction('Rejected')}
                  disabled={loading}
                  className="bg-off-track/10 border border-off-track/30 hover:bg-off-track/20 text-off-track px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Reject CR
                </button>
                <button
                  onClick={() => handleReviewAction('Approved')}
                  disabled={loading}
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Approve CR</span>
                </button>
              </div>
            )}
            
            {selectedCR?.status === 'Submitted' && !isManagerOrAdmin && (
              <div className="text-[10px] text-text-muted font-mono italic">
                Awaiting Project Manager / PMO Admin review.
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
