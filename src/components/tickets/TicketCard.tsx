import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { formatRelativeTime } from '@/lib/utils'
import type { TicketWithRelations } from '@/types'

interface TicketCardProps {
  ticket: TicketWithRelations
}

/**
 * Compact card for displaying a ticket summary in list/grid views.
 *
 * The entire card is wrapped in a Next.js Link so clicking anywhere
 * navigates to the ticket detail page. Status and priority badges
 * provide at-a-glance triage information.
 */
export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Link href={`/tickets/${ticket.id}`} className="block">
      <Card className="transition-colors hover:border-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm leading-snug line-clamp-2">
              {ticket.title}
            </CardTitle>
            <TicketStatusBadge status={ticket.status} />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2 pt-0">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={ticket.priority} />
            {ticket.assignee && (
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {ticket.assignee.name}
              </span>
            )}
          </div>
          {ticket.createdAt && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(ticket.createdAt)}
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
