import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TicketPriority } from '@/types'

interface PriorityBadgeProps {
  priority: TicketPriority
  className?: string
}

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300',
  },
  medium: {
    label: 'Medium',
    className: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  high: {
    label: 'High',
    className: 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300',
  },
  urgent: {
    label: 'Urgent',
    className: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300',
  },
}

/**
 * Displays a ticket's priority level as a colour-coded badge.
 *
 * Colour semantics:
 *   low    - gray   : minimal urgency
 *   medium - blue   : standard priority
 *   high   - orange : needs attention soon
 *   urgent - red    : immediate action required
 */
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
