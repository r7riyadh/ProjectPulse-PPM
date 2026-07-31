'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts'
import { DollarSign, Plus, Trash2, ShieldAlert, Award, FileSpreadsheet, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/Dialog'
import { createBudgetEntry, deleteBudgetEntry } from '@/lib/actions/budget'
import { Project, BudgetEntry, Profile } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface BudgetTabProps {
  project: Project
  budgetEntries: BudgetEntry[]
  profiles: Profile[]
  currentProfile: Profile
}

const BUDGET_CATEGORIES = ['Hardware', 'Software', 'Labor', 'Consulting', 'Training', 'Infrastructure', 'Other'] as const

export function BudgetTab({ project, budgetEntries, profiles, currentProfile }: BudgetTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form fields
  const [category, setCategory] = useState<typeof BUDGET_CATEGORIES[number]>('Software')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [entryDate, setEntryDate] = useState('')

  const isManagerOrAdmin = ['pmo_admin', 'project_manager'].includes(currentProfile.role)

  // Calculate metrics
  const planned = Number(project.planned_budget)
  const actual = Number(project.actual_spend)
  const variance = planned - actual
  const percentConsumed = planned > 0 ? (actual / planned) * 100 : 0
  const isOverBudget = actual > planned

  // Aggregate budget entries by category for Recharts
  const aggregatedData = BUDGET_CATEGORIES.map((cat) => {
    const total = budgetEntries
      .filter((b) => b.category === cat)
      .reduce((sum, entry) => sum + Number(entry.amount), 0)
    return {
      category: cat,
      Amount: total
    }
  }).filter((d) => d.Amount > 0) // only show categories with expenses

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !entryDate || !description) {
      toast.error('Please enter all required fields.')
      return
    }

    setLoading(true)
    try {
      await createBudgetEntry({
        project_id: project.id,
        category,
        amount: Number(amount),
        description,
        entry_date: entryDate
      })
      toast.success('Expense logged successfully!')
      setIsAddOpen(false)
      setAmount('')
      setDescription('')
      setEntryDate('')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to log expense: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return
    setLoading(true)
    try {
      await deleteBudgetEntry(id, project.id)
      toast.success('Expense entry deleted.')
      router.refresh()
    } catch (err: any) {
      toast.error(`Failed to delete entry: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 1. Over budget warning banner */}
      {isOverBudget && (
        <div className="p-4 rounded-xl border border-off-track/40 bg-off-track/10 text-off-track flex items-center space-x-3 text-sm animate-pulse shadow-md shadow-off-track/10">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-bold">CRITICAL WARNING: </span>
            This project has exceeded its planned budget limit of <span className="font-mono font-bold">{formatCurrency(planned)}</span> by <span className="font-mono font-bold">{formatCurrency(actual - planned)}</span>! Immediate scope scaling or change approvals needed.
          </div>
        </div>
      )}

      {/* 2. Budget Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        
        {/* Planned Budget */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-text-secondary uppercase">Planned Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-text-primary">{formatCurrency(planned)}</div>
          </CardContent>
        </Card>

        {/* Actual Spend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-text-secondary uppercase">Actual Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-text-primary">{formatCurrency(actual)}</div>
          </CardContent>
        </Card>

        {/* Variance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-text-secondary uppercase">Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-extrabold font-mono ${variance >= 0 ? 'text-on-track' : 'text-off-track'}`}>
              {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
            </div>
          </CardContent>
        </Card>

        {/* Consumed Progress */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-mono text-text-secondary uppercase">% Budget Consumed</CardTitle>
            <StatusBadge status={`${percentConsumed.toFixed(0)}%`} type="type" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="w-full bg-border/40 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full ${isOverBudget ? 'bg-off-track' : 'bg-primary'}`} 
                style={{ width: `${Math.min(percentConsumed, 100)}%` }} 
              />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 3. Expenses Aggregated Category Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category breakdown bar chart */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Expenses Category Breakdown</CardTitle>
            <CardDescription>Aggregated actual spend mapped across operational categories.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            {aggregatedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" opacity={0.3} />
                  <XAxis dataKey="category" stroke="hsl(222, 15%, 60%)" fontSize={10} />
                  <YAxis stroke="hsl(222, 15%, 60%)" fontSize={10} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ background: '#ffffff', border: '1px solid #e6e7e4', borderRadius: '8px' }}
                    itemStyle={{ color: '#0c1927' }}
                  />
                  <Bar dataKey="Amount" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-xs">
                No active budget entries logged. Log an expense to visualize.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Panel / Logging */}
        <Card className="lg:col-span-4 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Log Ledger Entry</CardTitle>
            <CardDescription>Register project expenditures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <p className="text-xs text-text-secondary leading-relaxed">
              Every logged expense shifts the project actual spend total dynamically inside the database, revalidating metrics across the dashboard and generating audit events.
            </p>
            {isManagerOrAdmin ? (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <button className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all shadow cursor-pointer flex items-center justify-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Log New Expense</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddExpense}>
                    <DialogHeader>
                      <DialogTitle>Log Project Expense</DialogTitle>
                      <DialogDescription>Specify operational category, budget amount, and log date.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-xs">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-mono uppercase text-text-secondary">Amount (USD) *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 15000"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-mono uppercase text-text-secondary">Log Date *</label>
                          <input
                            type="date"
                            required
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-mono uppercase text-text-secondary">Category *</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
                        >
                          {BUDGET_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-mono uppercase text-text-secondary">Description *</label>
                        <input
                          type="text"
                          required
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g. AWS Snowball Rental"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:border-primary transition-all text-xs"
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
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Log Expense</span>}
                      </button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="p-3 bg-surface border border-border/60 rounded-lg text-[10px] text-text-muted flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-at-risk" />
                <span>Modification restricted (PM/Admins only).</span>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* 4. Detailed Expense Ledger Table */}
      <Card className="glass-panel p-0 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-xs min-w-[750px]">
          <thead>
            <tr className="border-b border-border/60 bg-surface/50 text-text-muted font-mono uppercase text-[10px]">
              <th className="p-4">Expense Date</th>
              <th className="p-4">Category</th>
              <th className="p-4">Description</th>
              <th className="p-4">Logged By</th>
              <th className="p-4 text-right">Amount (USD)</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {budgetEntries.map((b) => (
              <tr key={b.id} className="hover:bg-surface-raised/40 transition-colors">
                <td className="p-4 text-text-muted">{formatDate(b.entry_date)}</td>
                <td className="p-4">
                  <StatusBadge status={b.category} type="type" />
                </td>
                <td className="p-4 text-text-primary font-sans font-medium">{b.description || '—'}</td>
                <td className="p-4 text-text-secondary font-sans">{b.logger?.full_name || 'System User'}</td>
                <td className="p-4 text-right font-bold text-text-primary">{formatCurrency(b.amount)}</td>
                <td className="p-4 text-center">
                  {isManagerOrAdmin ? (
                    <button
                      onClick={() => handleDeleteExpense(b.id)}
                      disabled={loading}
                      className="p-1.5 rounded hover:bg-surface hover:text-off-track border border-transparent hover:border-border text-text-muted transition-colors cursor-pointer"
                      title="Delete expense"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-text-muted font-sans">LOCKED</span>
                  )}
                </td>
              </tr>
            ))}
            {budgetEntries.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-muted font-medium font-sans">
                  No expenditures logged in the ledger.
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
