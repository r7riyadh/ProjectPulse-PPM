import * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeType = 
  | 'health' 
  | 'milestone' 
  | 'risk-severity' 
  | 'risk-status' 
  | 'cr-status' 
  | 'priority' 
  | 'raci'
  | 'role'
  | 'type'

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string
  type: BadgeType
}

export function StatusBadge({ className, status, type, ...props }: StatusBadgeProps) {
  const normStatus = status.trim().toLowerCase()

  // Mappings for CSS colors matching exact HSL codes
  let bgStyle = ''
  let textStyle = ''
  let borderStyle = ''

  if (type === 'health') {
    if (normStatus.includes('on track')) {
      bgStyle = 'bg-[hsl(142,60%,88%)]'
      textStyle = 'text-[hsl(142,71%,22%)]'
      borderStyle = 'border-[hsl(142,60%,70%)]'
    } else if (normStatus.includes('at risk')) {
      bgStyle = 'bg-[hsl(38,90%,88%)]'
      textStyle = 'text-[hsl(38,92%,22%)]'
      borderStyle = 'border-[hsl(38,80%,65%)]'
    } else if (normStatus.includes('off track')) {
      bgStyle = 'bg-[hsl(0,80%,90%)]'
      textStyle = 'text-[hsl(0,84%,28%)]'
      borderStyle = 'border-[hsl(0,75%,72%)]'
    } else if (normStatus.includes('completed')) {
      bgStyle = 'bg-[hsl(217,85%,88%)]'
      textStyle = 'text-[hsl(217,91%,25%)]'
      borderStyle = 'border-[hsl(217,80%,65%)]'
    } else if (normStatus.includes('on hold')) {
      bgStyle = 'bg-[hsl(270,50%,90%)]'
      textStyle = 'text-[hsl(270,50%,28%)]'
      borderStyle = 'border-[hsl(270,45%,68%)]'
    } else if (normStatus.includes('archived')) {
      bgStyle = 'bg-[hsl(220,15%,88%)]'
      textStyle = 'text-[hsl(220,15%,30%)]'
      borderStyle = 'border-[hsl(220,15%,65%)]'
    }
  } else if (type === 'milestone') {
    if (normStatus.includes('pending')) {
      bgStyle = 'bg-[hsl(220,15%,88%)]'
      textStyle = 'text-[hsl(220,15%,28%)]'
      borderStyle = 'border-[hsl(220,15%,65%)]'
    } else if (normStatus.includes('in progress')) {
      bgStyle = 'bg-[hsl(217,85%,88%)]'
      textStyle = 'text-[hsl(217,91%,25%)]'
      borderStyle = 'border-[hsl(217,80%,65%)]'
    } else if (normStatus.includes('completed')) {
      bgStyle = 'bg-[hsl(142,60%,88%)]'
      textStyle = 'text-[hsl(142,71%,22%)]'
      borderStyle = 'border-[hsl(142,60%,70%)]'
    } else if (normStatus.includes('overdue')) {
      bgStyle = 'bg-[hsl(0,80%,90%)]'
      textStyle = 'text-[hsl(0,84%,28%)]'
      borderStyle = 'border-[hsl(0,75%,72%)]'
    }
  } else if (type === 'risk-severity' || type === 'priority') {
    if (normStatus.includes('low')) {
      bgStyle = 'bg-[hsl(142,60%,88%)]'
      textStyle = 'text-[hsl(142,71%,22%)]'
      borderStyle = 'border-[hsl(142,60%,70%)]'
    } else if (normStatus.includes('medium')) {
      bgStyle = 'bg-[hsl(38,90%,88%)]'
      textStyle = 'text-[hsl(38,92%,22%)]'
      borderStyle = 'border-[hsl(38,80%,65%)]'
    } else if (normStatus.includes('high')) {
      bgStyle = 'bg-[hsl(25,90%,88%)]'
      textStyle = 'text-[hsl(25,95%,25%)]'
      borderStyle = 'border-[hsl(25,80%,65%)]'
    } else if (normStatus.includes('critical')) {
      bgStyle = 'bg-[hsl(0,80%,90%)]'
      textStyle = 'text-[hsl(0,84%,28%)]'
      borderStyle = 'border-[hsl(0,75%,72%)]'
    }
  } else if (type === 'risk-status') {
    if (normStatus.includes('open')) {
      bgStyle = 'bg-[hsl(0,80%,90%)]'
      textStyle = 'text-[hsl(0,84%,28%)]'
      borderStyle = 'border-[hsl(0,75%,72%)]'
    } else if (normStatus.includes('mitigating')) {
      bgStyle = 'bg-[hsl(38,90%,88%)]'
      textStyle = 'text-[hsl(38,92%,22%)]'
      borderStyle = 'border-[hsl(38,80%,65%)]'
    } else if (normStatus.includes('closed')) {
      bgStyle = 'bg-[hsl(142,60%,88%)]'
      textStyle = 'text-[hsl(142,71%,22%)]'
      borderStyle = 'border-[hsl(142,60%,70%)]'
    } else if (normStatus.includes('accepted')) {
      bgStyle = 'bg-[hsl(270,50%,90%)]'
      textStyle = 'text-[hsl(270,50%,28%)]'
      borderStyle = 'border-[hsl(270,45%,68%)]'
    }
  } else if (type === 'cr-status') {
    if (normStatus.includes('submitted')) {
      bgStyle = 'bg-[hsl(220,15%,88%)]'
      textStyle = 'text-[hsl(220,15%,28%)]'
      borderStyle = 'border-[hsl(220,15%,65%)]'
    } else if (normStatus.includes('under review')) {
      bgStyle = 'bg-[hsl(38,90%,88%)]'
      textStyle = 'text-[hsl(38,92%,22%)]'
      borderStyle = 'border-[hsl(38,80%,65%)]'
    } else if (normStatus.includes('approved')) {
      bgStyle = 'bg-[hsl(142,60%,88%)]'
      textStyle = 'text-[hsl(142,71%,22%)]'
      borderStyle = 'border-[hsl(142,60%,70%)]'
    } else if (normStatus.includes('rejected')) {
      bgStyle = 'bg-[hsl(0,80%,90%)]'
      textStyle = 'text-[hsl(0,84%,28%)]'
      borderStyle = 'border-[hsl(0,75%,72%)]'
    }
  } else if (type === 'raci') {
    if (normStatus.includes('responsible')) {
      bgStyle = 'bg-[hsl(217,85%,88%)]'
      textStyle = 'text-[hsl(217,91%,25%)]'
      borderStyle = 'border-[hsl(217,80%,65%)]'
    } else if (normStatus.includes('accountable')) {
      bgStyle = 'bg-[hsl(270,50%,90%)]'
      textStyle = 'text-[hsl(270,50%,28%)]'
      borderStyle = 'border-[hsl(270,45%,68%)]'
    } else if (normStatus.includes('consulted')) {
      bgStyle = 'bg-[hsl(38,90%,88%)]'
      textStyle = 'text-[hsl(38,92%,22%)]'
      borderStyle = 'border-[hsl(38,80%,65%)]'
    } else if (normStatus.includes('informed')) {
      bgStyle = 'bg-[hsl(220,15%,88%)]'
      textStyle = 'text-[hsl(220,15%,28%)]'
      borderStyle = 'border-[hsl(220,15%,65%)]'
    }
  } else if (type === 'role') {
    if (normStatus.includes('pmo_admin')) {
      bgStyle = 'bg-[hsl(270,50%,90%)]'
      textStyle = 'text-[hsl(270,50%,28%)]'
      borderStyle = 'border-[hsl(270,45%,68%)]'
    } else if (normStatus.includes('project_manager') || normStatus.includes('lead')) {
      bgStyle = 'bg-[hsl(217,85%,88%)]'
      textStyle = 'text-[hsl(217,91%,25%)]'
      borderStyle = 'border-[hsl(217,80%,65%)]'
    } else if (normStatus.includes('team_member')) {
      bgStyle = 'bg-[hsl(142,60%,88%)]'
      textStyle = 'text-[hsl(142,71%,22%)]'
      borderStyle = 'border-[hsl(142,60%,70%)]'
    } else if (normStatus.includes('stakeholder')) {
      bgStyle = 'bg-[hsl(220,15%,88%)]'
      textStyle = 'text-[hsl(220,15%,28%)]'
      borderStyle = 'border-[hsl(220,15%,65%)]'
    }
  }

  // Fallback defaults for unmapped states (like project type)
  if (!bgStyle) {
    bgStyle = 'bg-[hsl(220,15%,88%)]'
    textStyle = 'text-[hsl(220,15%,28%)]'
    borderStyle = 'border-[hsl(220,15%,65%)]'
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-sans tracking-wide transition-colors",
        bgStyle,
        textStyle,
        borderStyle,
        className
      )}
      {...props}
    >
      {status}
    </div>
  )
}
