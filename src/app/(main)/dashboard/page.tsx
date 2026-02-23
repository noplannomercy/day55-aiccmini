import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { tickets, users } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { StatusChart } from '@/components/dashboard/StatusChart'
import { PriorityChart } from '@/components/dashboard/PriorityChart'
import { RecentTickets } from '@/components/dashboard/RecentTickets'
import type { TicketStatus, TicketPriority } from '@/types'

/**
 * /dashboard — main dashboard page.
 *
 * Server Component that fetches aggregate ticket statistics directly
 * from the database (no internal HTTP round-trip) and renders KPI cards,
 * status/priority charts, and a recent tickets table.
 */
export default async function DashboardPage() {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  const tenantId = session.tenantId

  const [statusRows, priorityRows, totalRows, recentTickets] =
    await Promise.all([
      db
        .select({
          status: tickets.status,
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId))
        .groupBy(tickets.status),

      db
        .select({
          priority: tickets.priority,
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId))
        .groupBy(tickets.priority),

      db
        .select({
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId)),

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

  const statusCounts: Record<TicketStatus, number> = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  }
  for (const row of statusRows) {
    statusCounts[row.status as TicketStatus] = row.count
  }

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          안녕하세요, {session.name}님. 현재 티켓 현황을 확인하세요.
        </p>
      </div>

      {/* KPI stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="전체 티켓"
          value={totalTickets}
          description="등록된 전체 티켓 수"
        />
        <StatsCard
          title="Open"
          value={statusCounts.open}
          colorClass="text-blue-600"
          description="대기 중인 티켓"
        />
        <StatsCard
          title="In Progress"
          value={statusCounts.in_progress}
          colorClass="text-amber-600"
          description="처리 중인 티켓"
        />
        <StatsCard
          title="Resolved"
          value={statusCounts.resolved}
          colorClass="text-green-600"
          description="해결된 티켓"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StatusChart data={statusCounts} />
        <PriorityChart data={priorityCounts} />
      </div>

      {/* Recent tickets */}
      <RecentTickets
        tickets={recentTickets.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assigneeName: t.assigneeName ?? null,
          createdAt:
            t.createdAt instanceof Date
              ? t.createdAt.toISOString()
              : String(t.createdAt),
        }))}
      />
    </div>
  )
}
