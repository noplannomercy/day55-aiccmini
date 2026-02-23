/**
 * /api/dashboard — aggregate statistics for the tenant dashboard.
 *
 * GET — returns ticket counts grouped by status and priority, total count,
 *       and the 10 most recently created tickets with assignee names.
 *       Any authenticated user may access their tenant's dashboard.
 *
 * Pipeline: authenticate → run parallel queries → respond.
 */

import { getSessionUser } from '@/lib/auth'
import { handleApiError, UnauthorizedError } from '@/lib/errors'
import { db } from '@/lib/db'
import { tickets, users } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import type { TicketStatus, TicketPriority } from '@/types'

export async function GET(): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    const tenantId = sessionUser.tenantId

    const [statusRows, priorityRows, totalRows, recentTickets] =
      await Promise.all([
        // 1. Count tickets grouped by status
        db
          .select({
            status: tickets.status,
            count: sql<number>`count(*)`.mapWith(Number),
          })
          .from(tickets)
          .where(eq(tickets.tenantId, tenantId))
          .groupBy(tickets.status),

        // 2. Count tickets grouped by priority
        db
          .select({
            priority: tickets.priority,
            count: sql<number>`count(*)`.mapWith(Number),
          })
          .from(tickets)
          .where(eq(tickets.tenantId, tenantId))
          .groupBy(tickets.priority),

        // 3. Total ticket count
        db
          .select({
            count: sql<number>`count(*)`.mapWith(Number),
          })
          .from(tickets)
          .where(eq(tickets.tenantId, tenantId)),

        // 4. Recent 10 tickets with assignee name
        db
          .select({
            id: tickets.id,
            title: tickets.title,
            status: tickets.status,
            priority: tickets.priority,
            assigneeName: users.name,
            createdAt: tickets.createdAt,
          })
          .from(tickets)
          .leftJoin(users, eq(tickets.assigneeId, users.id))
          .where(eq(tickets.tenantId, tenantId))
          .orderBy(desc(tickets.createdAt))
          .limit(10),
      ])

    // Build status counts with defaults for all possible values
    const statusCounts: Record<TicketStatus, number> = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    }
    for (const row of statusRows) {
      statusCounts[row.status as TicketStatus] = row.count
    }

    // Build priority counts with defaults for all possible values
    const priorityCounts: Record<TicketPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    }
    for (const row of priorityRows) {
      priorityCounts[row.priority as TicketPriority] = row.count
    }

    const totalTickets = totalRows[0]?.count ?? 0

    return Response.json({
      statusCounts,
      priorityCounts,
      totalTickets,
      recentTickets: recentTickets.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assigneeName: t.assigneeName ?? null,
        createdAt: t.createdAt,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
