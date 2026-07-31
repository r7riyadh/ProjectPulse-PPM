'use client'

import { Activity, Clock, User } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ProjectEvent } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface ActivityLogTabProps {
  events: ProjectEvent[]
}

export function ActivityLogTab({ events }: ActivityLogTabProps) {
  return (
    <Card className="animate-fade-in-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Audit Trail & Events Ledger</CardTitle>
          <CardDescription>Permanently logged adjustments, approvals, and status transitions.</CardDescription>
        </div>
        <Activity className="h-5 w-5 text-text-muted" />
      </CardHeader>
      
      <CardContent className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60 p-6">
        {events.length > 0 ? (
          events.map((e) => (
            <div key={e.id} className="relative pl-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
              
              {/* Node dot on the timeline */}
              <div className="absolute left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-border group-hover:bg-primary border border-background transition-all" />
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-full bg-border/40 flex items-center justify-center text-text-secondary text-[9px] shrink-0 font-bold border border-border">
                    {e.actor?.full_name ? e.actor.full_name.substring(0, 2).toUpperCase() : 'SYS'}
                  </div>
                  <span className="text-xs font-bold text-text-primary">
                    {e.actor?.full_name || 'System Automated Trigger'}
                  </span>
                  <StatusBadge status={e.event_type} type="type" />
                </div>
                <p className="text-xs text-text-secondary leading-normal pl-8">
                  {e.description}
                </p>
              </div>
              
              <div className="text-[10px] font-mono text-text-muted sm:text-right shrink-0 pl-8 sm:pl-0 flex items-center space-x-1">
                <Clock className="h-3 w-3 inline text-text-muted" />
                <span>{formatDate(e.created_at)}</span>
              </div>

            </div>
          ))
        ) : (
          <div className="text-center text-text-muted text-xs py-8">
            No events logged in the project audit history.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
