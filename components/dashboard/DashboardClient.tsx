'use client'

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Briefcase, AlertTriangle, CheckCircle, HelpCircle, TrendingUp, DollarSign, Activity, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Project, Milestone, Risk, ProjectEvent } from '@/lib/types'

interface DashboardClientProps {
  projects: Project[]
  overdueMilestones: (Milestone & { project: Project })[]
  openRisks: (Risk & { project: Project })[]
  recentActivities: (ProjectEvent & { project?: Project })[]
}

export function DashboardClient({
  projects,
  overdueMilestones,
  openRisks,
  recentActivities
}: DashboardClientProps) {
  
  // 1. Calculate KPI Metrics
  const totalProjects = projects.length
  
  const onTrackCount = projects.filter(p => p.health_status === 'On Track').length
  const atRiskCount = projects.filter(p => p.health_status === 'At Risk').length
  const offTrackCount = projects.filter(p => p.health_status === 'Off Track').length
  const completedCount = projects.filter(p => p.health_status === 'Completed').length
  const onHoldCount = projects.filter(p => p.health_status === 'On Hold').length

  const totalPlannedBudget = projects.reduce((acc, p) => acc + Number(p.planned_budget), 0)
  const totalActualSpend = projects.reduce((acc, p) => acc + Number(p.actual_spend), 0)
  
  const budgetVariance = totalPlannedBudget - totalActualSpend
  const percentConsumed = totalPlannedBudget > 0 ? (totalActualSpend / totalPlannedBudget) * 100 : 0
  const variancePercentage = totalPlannedBudget > 0 ? (budgetVariance / totalPlannedBudget) * 100 : 0

  // 2. Prepare Pie Chart Data (Health status counts)
  const healthPieData = [
    { name: 'On Track', value: onTrackCount, color: 'hsl(142, 71%, 45%)' },
    { name: 'At Risk', value: atRiskCount, color: 'hsl(38, 92%, 50%)' },
    { name: 'Off Track', value: offTrackCount, color: 'hsl(0, 84%, 60%)' },
    { name: 'On Hold', value: onHoldCount, color: 'hsl(270, 50%, 60%)' },
    { name: 'Completed', value: completedCount, color: 'hsl(217, 91%, 60%)' }
  ].filter(item => item.value > 0)

  // 3. Prepare Bar Chart Data (Planned Budget vs. Actual Spend)
  const budgetBarData = projects.map(p => ({
    name: p.project_number,
    fullName: p.name,
    Planned: Number(p.planned_budget),
    Actual: Number(p.actual_spend)
  }))

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* 1. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Total Projects Card */}
        <Card className="glass-panel-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold font-mono text-text-secondary">
              TOTAL IT PROJECTS
            </CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-text-primary">
              {totalProjects}
            </div>
            <div className="flex items-center space-x-1.5 mt-2 text-xs">
              <span className="text-on-track font-semibold">{onTrackCount} On Track</span>
              <span className="text-text-muted">•</span>
              <span className="text-at-risk font-semibold">{atRiskCount} At Risk</span>
              <span className="text-text-muted">•</span>
              <span className="text-off-track font-semibold">{offTrackCount} Off</span>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Budget Card */}
        <Card className="glass-panel-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold font-mono text-text-secondary">
              PORTFOLIO BUDGET
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-text-primary">
              {formatCurrency(totalPlannedBudget)}
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Planned IT investments across assets
            </p>
          </CardContent>
        </Card>

        {/* Actual Portfolio Spend Card */}
        <Card className="glass-panel-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold font-mono text-text-secondary">
              ACTUAL SPEND
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-on-track" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-text-primary">
              {formatCurrency(totalActualSpend)}
            </div>
            <div className="flex items-center mt-2 w-full bg-border/40 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${percentConsumed > 100 ? 'bg-off-track' : 'bg-primary'}`} 
                style={{ width: `${Math.min(percentConsumed, 100)}%` }} 
              />
            </div>
            <p className="text-[10px] text-text-muted mt-1.5">
              {percentConsumed.toFixed(1)}% of planned budget consumed
            </p>
          </CardContent>
        </Card>

        {/* Budget Variance Card */}
        <Card className="glass-panel-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold font-mono text-text-secondary">
              BUDGET VARIANCE
            </CardTitle>
            <AlertTriangle className={`h-5 w-5 ${budgetVariance >= 0 ? 'text-on-track' : 'text-off-track'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${budgetVariance >= 0 ? 'text-on-track' : 'text-off-track'}`}>
              {formatCurrency(Math.abs(budgetVariance))}
            </div>
            <p className="text-xs text-text-secondary mt-2">
              {budgetVariance >= 0 ? 'Under budget (Positive Variance)' : 'Over budget (Cost Deficit)'}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* 2. Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Project Health Donut Chart */}
        <Card className="lg:col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle>Portfolio Health Status</CardTitle>
            <CardDescription>Visual health ratio across projects.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[250px] relative">
            {healthPieData.length > 0 ? (
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {healthPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#ffffff', border: '1px solid #e6e7e4', borderRadius: '8px' }}
                      itemStyle={{ color: '#0c1927' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-text-muted text-xs">No active project health data.</div>
            )}
            
            {/* Custom chart legend to matching enterprise look */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono text-center">
              {healthPieData.map((d) => (
                <div key={d.name} className="flex flex-col items-center p-1 border border-border/40 bg-surface/50 rounded">
                  <span className="font-bold text-text-primary">{d.value}</span>
                  <span className="text-text-muted uppercase text-[9px] mt-0.5" style={{ color: d.color }}>
                    {d.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget Health Bar Chart */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Budget Health (Planned vs. Actual)</CardTitle>
            <CardDescription>Financial profiles mapped by project code.</CardDescription>
          </CardHeader>
          <CardContent className="w-full h-[300px] min-h-[250px]">
            {budgetBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" opacity={0.4} />
                  <XAxis dataKey="name" stroke="hsl(222, 15%, 60%)" fontSize={10} className="font-mono" />
                  <YAxis stroke="hsl(222, 15%, 60%)" fontSize={10} className="font-mono" tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ background: '#ffffff', border: '1px solid #e6e7e4', borderRadius: '8px' }}
                    itemStyle={{ color: '#0c1927' }}
                    labelFormatter={(label) => {
                      const proj = budgetBarData.find(b => b.name === label)
                      return proj ? `${proj.name}: ${proj.fullName}` : label
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'hsl(222, 15%, 60%)' }} />
                  <Bar dataKey="Planned" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-xs">No project budget details available.</div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* 3. Alerts & Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side: Overdue Milestones (Watchlist) */}
        <Card className="xl:col-span-5 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Milestone Alerts</CardTitle>
              <CardDescription>Pending deliveries past due target dates.</CardDescription>
            </div>
            {overdueMilestones.length > 0 && (
              <StatusBadge status={`${overdueMilestones.length} OVERDUE`} type="milestone" className="animate-pulse" />
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[380px] space-y-3">
            {overdueMilestones.length > 0 ? (
              overdueMilestones.map((m) => (
                <div 
                  key={m.id} 
                  className="p-4 rounded-lg border border-off-track/20 bg-off-track/5 hover:bg-off-track/10 transition-colors flex flex-col space-y-2"
                >
                  <div className="flex items-start justify-between space-x-2">
                    <Link 
                      href={`/projects/${m.project_id}`}
                      className="font-bold text-text-primary text-sm hover:underline hover:text-primary transition-all line-clamp-1"
                    >
                      {m.title}
                    </Link>
                    <StatusBadge status="Overdue" type="milestone" />
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">{m.description || 'No description provided.'}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1">
                    <span>Project: {m.project?.project_number}</span>
                    <span className="text-off-track font-bold">Due: {formatDate(m.due_date)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted text-xs">
                <CheckCircle className="h-10 w-10 text-on-track/70 mb-2" />
                <span className="font-semibold text-text-secondary">Milestones on schedule</span>
                <p className="text-[10px] text-text-muted max-w-[200px] mt-1">
                  All active milestones have pending timelines within safe dates.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Side: Risk Watchlist */}
        <Card className="xl:col-span-7 flex flex-col">
          <CardHeader>
            <CardTitle>Critical Risk Watchlist</CardTitle>
            <CardDescription>Highest scoring active threats across projects.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 max-h-[380px] p-0 flex flex-col">
            {openRisks.length > 0 ? (
              <div className="overflow-x-auto w-full flex-1">
                <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-surface/50 text-text-muted font-mono uppercase text-[10px]">
                      <th className="p-3">Risk Code / Project</th>
                      <th className="p-3">Title & Category</th>
                      <th className="p-3 text-center">Score</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Mitigation Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {openRisks.map((risk) => (
                      <tr key={risk.id} className="hover:bg-surface-raised/40 transition-colors">
                        <td className="p-3 font-mono">
                          <Link href={`/projects/${risk.project_id}`} className="hover:underline text-primary font-bold">
                            {risk.project?.project_number}
                          </Link>
                          <span className="block text-[10px] text-text-muted truncate max-w-[100px]">{risk.project?.name}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-text-primary block line-clamp-1">{risk.title}</span>
                          <span className="text-[10px] text-text-muted">{risk.category}</span>
                        </td>
                        <td className="p-3 text-center font-bold font-mono text-sm">{risk.risk_score}</td>
                        <td className="p-3">
                          <StatusBadge status={risk.severity} type="risk-severity" />
                        </td>
                        <td className="p-3 max-w-[180px]">
                          <p className="line-clamp-2 text-text-secondary leading-normal">{risk.mitigation_plan || 'No mitigation logged.'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted text-xs flex-1">
                <CheckCircle className="h-10 w-10 text-on-track/70 mb-2" />
                <span className="font-semibold text-text-secondary">Risk Register Clear</span>
                <p className="text-[10px] text-text-muted mt-1">No open risks registered across the portfolio.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* 4. Audit Log Timeline (Recent Portfolio Activity) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Portfolio Activity Feed</CardTitle>
            <CardDescription>Realtime audit logs of project status modifications.</CardDescription>
          </div>
          <Activity className="h-5 w-5 text-text-muted" />
        </CardHeader>
        <CardContent className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60">
          {recentActivities.length > 0 ? (
            recentActivities.map((act) => (
              <div key={act.id} className="relative pl-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group">
                
                {/* Timeline node dot */}
                <div className="absolute left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-border group-hover:bg-primary border border-background transition-all" />
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-text-primary">
                      {act.actor?.full_name || 'System Auto-Trigger'}
                    </span>
                    <StatusBadge status={act.event_type} type="type" />
                    <span className="text-[10px] font-mono text-text-muted">
                      in project {act.project?.name}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{act.description}</p>
                </div>
                
                <div className="text-[10px] font-mono text-text-muted sm:text-right shrink-0">
                  {formatDate(act.created_at)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-text-muted text-xs py-4">No recent portfolio events logged.</div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
