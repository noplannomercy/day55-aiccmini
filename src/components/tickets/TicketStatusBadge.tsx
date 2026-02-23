import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TicketStatus } from '@/types'

interface TicketStatusBadgeProps {
  status: TicketStatus
  className?: string
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  in_progress: {
    label: 'In Progress',
    className: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  resolved: {
    label: 'Resolved',
    className: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300',
  },
  closed: {
    label: 'Closed',
    className: 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300',
  },
}

/**
 * Displays a ticket's status as a colour-coded badge.
 *
 * Colour semantics:
 *   open        - blue   : new ticket awaiting triage
 *   in_progress - amber  : actively being worked on
 *   resolved    - green  : solution provided
 *   closed      - gray   : no further action needed
 */
export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
