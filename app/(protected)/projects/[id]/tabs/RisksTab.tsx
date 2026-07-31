'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertOctagon, Plus, Trash2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/Dialog'
import { createRisk, updateRisk, deleteRisk } from '@/lib/actions/risks'
import { Project, Risk, Profile } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface RisksTabProps {
  project: Project
  risks: Risk[]
  profiles: Profile[]
  currentProfile: Profile
}

export function RisksTab({ project, risks, profiles, currentProfile }: RisksTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Technical')
  const [probability, setProbability] = useState(3)
  const [impact, setImpact] = useState(3)
  const [ownerId, setOwnerId] = useState('')
  const [mitigationPlan, setMitigationPlan] = useState('')
  const [status, setStatus] = useState('Open')

  const isManagerOrAdmin = ['pmo_admin', 'project_manager'].includes(currentProfile.role)

  const handleAddRisk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !ownerId) {
      toast.error('Title and Owner are required fields.')
      return
    }

    setLoading(true)
    try {
      await createRisk({
        project_id: project.id,
        title,
        description,
        category,
        probability,
        impact,
        owner_id: ownerId,
        mitigation_plan: mitigationPlan,
        status
      })
      toast.success('Risk successfully logged in registry!')
      setIsAddOpen(false)
      setTitle('')
      setDescription('')
      setMitigationPlan('')
      setOwnerId('')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to create risk: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (riskId: string, newStatus: string) => {
    setLoading(true)
    try {
      await updateRisk(riskId, project.id, { status: newStatus as any })
      toast.success('Risk status updated!')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to update risk status: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (riskId: string) => {
    if (!confirm('Are you sure you want to delete this risk from registry?')) return
    setLoading(true)
    try {
      await deleteRisk(riskId, project.id)
      toast.success('Risk removed from register.')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to delete risk: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Get cell severity color based on coordinate product
  const getCellStyles = (p: number, i: number) => {
    const score = p * i
    if (p === 1 && (i === 1 || i === 2)) {
      return {
        bg: 'bg-[hsl(142,60%,85%)]',
        border: 'border-[hsl(142,50%,75%)]',
        hover: 'hover:bg-[hsl(142,60%,80%)]'
      }
    }
    if ((p === 1 || p === 2) && i === 3) {
      return {
        bg: 'bg-[hsl(80,60%,82%)]',
        border: 'border-[hsl(80,50%,72%)]',
        hover: 'hover:bg-[hsl(80,60%,77%)]'
      }
    }
    if (score >= 17) {
      return {
        bg: 'bg-[hsl(0,80%,87%)]',
        border: 'border-[hsl(0,65%,77%)]',
        hover: 'hover:bg-[hsl(0,80%,82%)]'
      }
    }
    if (score >= 12 && score <= 16) {
      return {
        bg: 'bg-[hsl(25,90%,82%)]',
        border: 'border-[hsl(25,75%,72%)]',
        hover: 'hover:bg-[hsl(25,90%,77%)]'
      }
    }
    return {
      bg: 'bg-[hsl(38,90%,82%)]',
      border: 'border-[hsl(38,75%,72%)]',
      hover: 'hover:bg-[hsl(38,90%,77%)]'
    }
  }

  const getSeverityColor = (severity: string) => {
    const s = severity.toLowerCase().trim()
    if (s === 'low') return 'hsl(142, 71%, 35%)'
    if (s === 'medium') return 'hsl(38, 92%, 40%)'
    if (s === 'high') return 'hsl(25, 95%, 43%)'
    return 'hsl(0, 84%, 50%)' // Critical
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 5x5 Risk Heat Map Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Heat Map Visualization Card */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle>5 × 5 Risk Heat Map Matrix</CardTitle>
            <CardDescription>Plotted risks across Probability (Y) and Impact (X) matrices.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            
            {/* Grid Container */}
            <div className="overflow-x-auto w-full flex justify-center py-2">
              <div className="w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] flex flex-col space-y-1 sm:space-y-1.5 relative select-none shrink-0">
              
              {/* Y Axis Label */}
              <div className="absolute left-[-28px] top-[40%] -rotate-90 text-[10px] font-bold font-mono tracking-widest text-text-muted">
                PROBABILITY
              </div>

              {/* 5 Rows */}
              {[5, 4, 3, 2, 1].map((p) => (
                <div key={p} className="flex-1 flex space-x-1.5">
                  {/* Row Label */}
                  <div className="w-5 flex items-center justify-center font-mono font-bold text-xs text-text-muted">
                    {p}
                  </div>
                  
                  {/* 5 Cells */}
                  {[1, 2, 3, 4, 5].map((i) => {
                    const cellRisks = risks.filter(r => r.probability === p && r.impact === i && r.status !== 'Closed')
                    const cellStyle = getCellStyles(p, i)
                    
                    return (
                      <div
                        key={i}
                        className={`flex-1 border rounded-lg flex items-center justify-center flex-wrap gap-1 p-1 transition-all relative group/cell ${cellStyle.bg} ${cellStyle.border} ${cellStyle.hover}`}
                      >
                        {/* Cell Background coordinate label shown on empty hover */}
                        <span className="absolute text-[8px] font-mono text-text-muted opacity-0 group-hover/cell:opacity-40 transition-opacity">
                          {p}×{i}
                        </span>

                        {/* Renders active risks at this coordinate as circles */}
                        {cellRisks.map((risk, idx) => {
                          const severityColor = getSeverityColor(risk.severity)
                          return (
                            <div
                              key={risk.id}
                              className="absolute top-1/2 left-1/2 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer hover:scale-125 hover:z-20 transition-all duration-150 group/dot select-none"
                              style={{
                                borderColor: severityColor,
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                transform: `translate(calc(-50% + ${idx * 6}px), calc(-50% + ${idx * 6}px))`
                              }}
                            >
                              <span 
                                className="font-mono font-bold text-xs"
                                style={{ color: severityColor }}
                              >
                                {risk.risk_score}
                              </span>

                              {/* Hover tooltip for individual risk node dot */}
                              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden group-hover/dot:block z-50 w-48 bg-surface p-2 border border-border rounded-lg shadow-xl text-[10px] text-text-primary pointer-events-none font-sans font-normal leading-tight">
                                <p className="font-bold text-text-primary truncate">{risk.title}</p>
                                <div className="flex items-center justify-between mt-1 text-text-muted font-mono text-[9px]">
                                  <span>Severity: {risk.severity}</span>
                                  <span>Score: {risk.risk_score}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}

              {/* X Axis Coordinates Labels */}
              <div className="flex pl-5 pt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-1 text-center font-mono font-bold text-xs text-text-muted">
                    {i}
                  </div>
                ))}
              </div>
              
              {/* X Axis Label */}
              <div className="text-center text-[10px] font-bold font-mono tracking-widest text-text-muted mt-2">
                IMPACT POTENTIAL
              </div>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Heat Map Legend and Actions Panel */}
        <Card className="lg:col-span-6 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Risk Overview Guidelines</CardTitle>
              <CardDescription>Risk score = Probability × Impact.</CardDescription>
            </div>
            {isManagerOrAdmin && (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <button className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow cursor-pointer">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Log Risk</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddRisk}>
                    <DialogHeader>
                      <DialogTitle>Log Project Risk Profile</DialogTitle>
                      <DialogDescription>Define risk parameters and write an mitigation action plan.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-mono uppercase text-text-secondary">Risk Title *</label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Host Posture Check Failures"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-mono uppercase text-text-secondary">Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Document background logs, technical implications..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-xs resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="font-mono uppercase text-text-secondary">Probability (1-5)</label>
                          <select
                            value={probability}
                            onChange={(e) => setProbability(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
                          >
                            <option value="1">1 - Low</option>
                            <option value="2">2 - Minor</option>
                            <option value="3">3 - Moderate</option>
                            <option value="4">4 - High</option>
                            <option value="5">5 - Critical</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-mono uppercase text-text-secondary">Impact (1-5)</label>
                          <select
                            value={impact}
                            onChange={(e) => setImpact(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
                          >
                            <option value="1">1 - Low</option>
                            <option value="2">2 - Minor</option>
                            <option value="3">3 - Moderate</option>
                            <option value="4">4 - High</option>
                            <option value="5">5 - Critical</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-mono uppercase text-text-secondary">Category</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
                          >
                            <option value="Technical">Technical</option>
                            <option value="Financial">Financial</option>
                            <option value="Resource">Resource</option>
                            <option value="Schedule">Schedule</option>
                            <option value="Compliance">Compliance</option>
                            <option value="Vendor">Vendor</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-mono uppercase text-text-secondary">Assign Owner *</label>
                          <select
                            required
                            value={ownerId}
                            onChange={(e) => setOwnerId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
                          >
                            <option value="">-- Choose Profile --</option>
                            {profiles.map((p) => (
                              <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-mono uppercase text-text-secondary">Status</label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
                          >
                            <option value="Open">Open</option>
                            <option value="Mitigating">Mitigating</option>
                            <option value="Closed">Closed</option>
                            <option value="Accepted">Accepted</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-mono uppercase text-text-secondary">Mitigation Action Plan</label>
                        <textarea
                          value={mitigationPlan}
                          onChange={(e) => setMitigationPlan(e.target.value)}
                          placeholder="What steps will be executed if the risk event triggers..."
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
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Log Risk</span>}
                      </button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="space-y-4 flex-1 justify-center flex flex-col text-xs text-text-secondary leading-relaxed">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-border bg-surface/50 rounded-lg">
                <span className="font-bold text-text-primary block mb-0.5">Critical (Score 17 - 25)</span>
                Red zone. Demands immediate mitigation strategies and weekly sponsor alerts.
              </div>
              <div className="p-3 border border-border bg-surface/50 rounded-lg">
                <span className="font-bold text-text-primary block mb-0.5">High (Score 10 - 16)</span>
                Orange zone. Requires proactive action plans and PM dashboard highlights.
              </div>
              <div className="p-3 border border-border bg-surface/50 rounded-lg">
                <span className="font-bold text-text-primary block mb-0.5">Medium (Score 5 - 9)</span>
                Yellow zone. PM tracking required. Documented mitigation triggers.
              </div>
              <div className="p-3 border border-border bg-surface/50 rounded-lg">
                <span className="font-bold text-text-primary block mb-0.5">Low (Score 1 - 4)</span>
                Green zone. Normal operations. Accepted status or passive mitigation.
              </div>
            </div>
            
            <div className="p-3 border border-border bg-surface/30 rounded-lg flex items-center space-x-2 text-[10px] text-text-muted font-mono mt-1">
              <AlertOctagon className="h-4 w-4 text-primary shrink-0" />
              <span>Plotted dots on the heatmap represent active (non-Closed) risk profiles.</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 2. Risk Register Details Table */}
      <Card className="glass-panel p-0 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-xs min-w-[800px]">
          <thead>
            <tr className="border-b border-border/60 bg-surface/50 text-text-muted font-mono uppercase text-[10px]">
              <th className="p-4">Risk ID / Title</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-center">Score (P×I)</th>
              <th className="p-4">Severity</th>
              <th className="p-4">Mitigation Action Plan</th>
              <th className="p-4">Owner</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {risks.map((risk) => (
              <tr key={risk.id} className="hover:bg-surface-raised/40 transition-colors">
                <td className="p-4 max-w-[150px]">
                  <span className="font-bold text-text-primary block line-clamp-1">{risk.title}</span>
                  <span className="text-[10px] text-text-muted line-clamp-1 mt-0.5">{risk.description || 'No description logged.'}</span>
                </td>
                <td className="p-4 text-text-secondary">{risk.category}</td>
                <td className="p-4 text-center font-bold font-mono text-sm">{risk.risk_score} <span className="text-text-muted text-[10px]">({risk.probability}×{risk.impact})</span></td>
                <td className="p-4">
                  <StatusBadge status={risk.severity} type="risk-severity" />
                </td>
                <td className="p-4 max-w-[200px]">
                  <p className="line-clamp-2 text-text-secondary leading-normal">{risk.mitigation_plan || '—'}</p>
                </td>
                <td className="p-4 text-text-secondary">
                  {risk.owner?.full_name || 'Unassigned'}
                </td>
                <td className="p-4">
                  {isManagerOrAdmin ? (
                    <select
                      value={risk.status}
                      onChange={(e) => handleStatusChange(risk.id, e.target.value)}
                      disabled={loading}
                      className="px-2 py-1 bg-surface border border-border text-[11px] font-semibold font-mono rounded text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
                    >
                      <option value="Open">Open</option>
                      <option value="Mitigating">Mitigating</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  ) : (
                    <StatusBadge status={risk.status} type="risk-status" />
                  )}
                </td>
                <td className="p-4 text-center">
                  {isManagerOrAdmin ? (
                    <button
                      onClick={() => handleDelete(risk.id)}
                      disabled={loading}
                      className="p-1.5 rounded hover:bg-surface hover:text-off-track border border-transparent hover:border-border text-text-muted transition-colors cursor-pointer"
                      title="Delete Risk"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-text-muted font-mono">LOCKED</span>
                  )}
                </td>
              </tr>
            ))}
            {risks.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-text-muted font-medium">
                  No risks registered in the register.
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
