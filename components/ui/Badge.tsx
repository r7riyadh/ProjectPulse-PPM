import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'info' | 'purple'
  value?: string
}

export function Badge({ className, variant = 'default', value, ...props }: BadgeProps) {
  // Automatically resolve style if value is provided
  let resolvedVariant = variant

  if (value) {
    const v = value.toLowerCase().trim()
    if (['on track', 'completed', 'success', 'open', 'low', 'approved'].includes(v)) {
      resolvedVariant = 'success'
    } else if (['at risk', 'warning', 'medium', 'under review', 'mitigating'].includes(v)) {
      resolvedVariant = 'warning'
    } else if (['off track', 'destructive', 'critical', 'rejected', 'overdue', 'high'].includes(v)) {
      resolvedVariant = 'destructive'
    } else if (['planning', 'in progress', 'info', 'submitted'].includes(v)) {
      resolvedVariant = 'info'
    } else if (['initiation', 'on hold', 'purple', 'closure'].includes(v)) {
      resolvedVariant = 'purple'
    }
  }

  const variantStyles = {
    default: "bg-surface-raised border-border text-text-primary",
    secondary: "bg-surface border-border text-text-secondary",
    outline: "border border-border text-text-secondary bg-transparent",
    success: "bg-on-track/10 border-on-track/30 text-on-track",
    warning: "bg-at-risk/10 border-at-risk/30 text-at-risk",
    destructive: "bg-off-track/10 border-off-track/30 text-off-track",
    info: "bg-primary/10 border-primary/30 text-primary",
    purple: "bg-on-hold/10 border-on-hold/30 text-on-hold",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[resolvedVariant],
        className
      )}
      {...props}
    />
  )
}
