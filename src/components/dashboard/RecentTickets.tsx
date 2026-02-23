'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { formatDate } from '@/lib/utils'
import type { TicketStatus, TicketPriority } from '@/types'

interface RecentTicket {
  id: string
  title: string
  status: string
  priority: string
  assigneeName: string | null
  createdAt: string
}

interface RecentTicketsProps {
  tickets: RecentTicket[]
}

/**
 * Displays the most recent tickets in a table format on the dashboard.
 * Each ticket title links to its detail page.
 */
export function RecentTickets({ tickets }: RecentTicketsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          최근 티켓
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            최근 티켓 없음
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>우선순위</TableHead>
                <TableHead>담당자</TableHead>
                <TableHead>날짜</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="max-w-[240px] truncate font-medium">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="hover:underline"
                    >
                      {ticket.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <TicketStatusBadge
                      status={ticket.status as TicketStatus}
                    />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge
                      priority={ticket.priority as TicketPriority}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ticket.assigneeName ?? '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
