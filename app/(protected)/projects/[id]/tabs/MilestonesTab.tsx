'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { Calendar, User, Plus, Trash2, CheckSquare, Clock, AlertCircle, Play, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/Dialog'
import { createMilestone, updateMilestone, deleteMilestone } from '@/lib/actions/milestones'
import { Project, Milestone, Profile } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface MilestonesTabProps {
  project: Project
  milestones: Milestone[]
  profiles: Profile[]
  currentProfile: Profile
}

export function MilestonesTab({ project, milestones, profiles, currentProfile }: MilestonesTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [status, setStatus] = useState('Pending')

  const isManagerOrAdmin = ['pmo_admin', 'project_manager'].includes(currentProfile.role)

  // Calculate project length in days for Recharts timeline positioning
  const projectStart = new Date(project.start_date).getTime()
  const projectEnd = new Date(project.end_date).getTime()
  const totalDurationDays = Math.max(1, Math.floor((projectEnd - projectStart) / (1000 * 60 * 60 * 24)))

  // Prep chart segment objects
  const chartData = milestones.map((m) => {
    const dueTime = new Date(m.due_date).getTime()
    // Days from project start
    const offset = Math.max(0, Math.floor((dueTime - projectStart) / (1000 * 60 * 60 * 24)))
    
    return {
      name: m.title.length > 20 ? m.title.substring(0, 18) + '..' : m.title,
      fullTitle: m.title,
      offset: offset,
      duration: Math.max(2, Math.floor(totalDurationDays * 0.04)), // dynamic width segment
      status: m.status,
      due: m.due_date
    }
  })

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !dueDate || !ownerId) {
      toast.error('Please enter all required fields')
      return
    }

    // Due date check
    const due = new Date(dueDate)
    if (due < new Date(project.start_date) || due > new Date(project.end_date)) {
      toast.error(`Due date must be within project range (${project.start_date} to ${project.end_date})`)
      return
    }

    setLoading(true)
    try {
      await createMilestone({
        project_id: project.id,
        title,
        description,
        due_date: dueDate,
        owner_id: ownerId,
        status
      })
      toast.success('Milestone created!')
      setIsAddOpen(false)
      setTitle('')
      setDescription('')
      setDueDate('')
      setOwnerId('')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to create milestone: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (milestoneId: string, newStatus: string) => {
    setLoading(true)
    try {
      await updateMilestone(milestoneId, project.id, { status: newStatus as any })
      toast.success('Milestone status updated!')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return
    setLoading(true)
    try {
      await deleteMilestone(milestoneId, project.id)
      toast.success('Milestone deleted')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to delete milestone: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 1. Gantt Timeline Chart Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Milestone Gantt Timeline</CardTitle>
            <CardDescription>Horizontal date assertions mapped relative to project lifecycle.</CardDescription>
          </div>
          {isManagerOrAdmin && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Milestone</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddMilestone}>
                  <DialogHeader>
                    <DialogTitle>Add Project Milestone</DialogTitle>
                    <DialogDescription>Specify title, due date, and assign ownership.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-mono uppercase text-text-secondary">Milestone Title *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. API Integration Completed"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono uppercase text-text-secondary">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detail delivery requirements, testing guidelines..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-xs resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-mono uppercase text-text-secondary">Target Due Date *</label>
                        <input
                          type="date"
                          required
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-mono uppercase text-text-secondary">Initial Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>

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
                      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Create Milestone</span>}
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        
        <CardContent className="h-[280px]">
          {milestones.length > 0 ? (
            <div className="overflow-x-auto w-full h-full">
              <div className="h-full min-w-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                  >
                    <XAxis 
                      type="number" 
                      domain={[0, totalDurationDays]} 
                      stroke="hsl(222, 15%, 60%)"
                      fontSize={9}
                      className="font-mono"
                      tickFormatter={(val) => {
                        const dateVal = new Date(projectStart + val * (1000 * 60 * 60 * 24))
                        return dateVal.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
                      }} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="hsl(222, 15%, 60%)" 
                      fontSize={10} 
                      width={110} 
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      contentStyle={{ background: '#ffffff', border: '1px solid #e6e7e4', borderRadius: '8px' }}
                      itemStyle={{ color: '#0c1927' }}
                      labelFormatter={(idx, items) => {
                        const item = items[0]?.payload
                        return item ? `${item.fullTitle}` : ''
                      }}
                      formatter={(value, name, item) => {
                        if (name === 'duration') {
                          return [formatDate(item.payload.due), 'Due Date']
                        }
                        return null
                      }}
                    />
                    {/* Stacked transparent spacer */}
                    <Bar dataKey="offset" stackId="m" fill="transparent" />
                    {/* Milestone status indicator block */}
                    <Bar dataKey="duration" stackId="m" radius={[2, 2, 2, 2]}>
                      {chartData.map((entry, index) => {
                        let fill = 'hsl(222, 15%, 40%)'
                        if (entry.status === 'Completed') fill = 'hsl(142, 71%, 45%)'
                        else if (entry.status === 'In Progress') fill = 'hsl(217, 91%, 60%)'
                        else if (entry.status === 'Overdue') fill = 'hsl(0, 84%, 60%)'
                        return <Cell key={`cell-${index}`} fill={fill} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-xs">
              No milestones recorded. Click "Add Milestone" to populate the timeline.
            </div>
          )}
        </CardContent>
      </Card>
 
      {/* 2. Milestones Grid List */}
      <Card className="glass-panel p-0 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50 text-text-muted font-mono uppercase text-[10px]">
                <th className="p-4">Delivery Title</th>
                <th className="p-4">Description</th>
                <th className="p-4">Target Date</th>
                <th className="p-4">Owner</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {milestones.map((m) => {
                const isOwner = m.owner_id === currentProfile.id
                const canModifyStatus = isManagerOrAdmin || (currentProfile.role === 'team_member' && isOwner)
                
                return (
                  <tr key={m.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="p-4 font-bold text-text-primary max-w-[150px] truncate">{m.title}</td>
                    <td className="p-4 text-text-secondary max-w-[200px] truncate">{m.description || '—'}</td>
                    <td className="p-4 font-mono text-text-muted">{formatDate(m.due_date)}</td>
                    <td className="p-4 text-text-secondary">
                      {m.owner?.full_name || 'Unassigned'}
                    </td>
                    <td className="p-4">
                      {canModifyStatus ? (
                        <select
                          value={m.status}
                          onChange={(e) => handleStatusChange(m.id, e.target.value)}
                          disabled={loading}
                          className="px-2 py-1 bg-surface border border-border text-[11px] font-semibold font-mono rounded text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      ) : (
                        <StatusBadge status={m.status} type="milestone" />
                      )}
                    </td>
                    <td className="p-4">
                      {isManagerOrAdmin ? (
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={loading}
                          className="p-1.5 rounded hover:bg-surface hover:text-off-track border border-transparent hover:border-border text-text-muted transition-colors cursor-pointer"
                          title="Delete Milestone"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-text-muted font-mono">LOCKED</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {milestones.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted font-medium">
                    No deliverables registered for this project.
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
