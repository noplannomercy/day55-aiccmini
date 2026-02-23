import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { listTickets } from '@/services/ticket.service'
import { listUsers } from '@/services/user.service'
import { TicketCard } from '@/components/tickets/TicketCard'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { Button } from '@/components/ui/button'
import type { TicketStatus, TicketPriority } from '@/types'

/**
 * /tickets — ticket list page.
 *
 * Server Component that reads searchParams for filtering and pagination,
 * then calls the ticket service directly (no internal HTTP round-trip).
 *
 * The TicketFilters client component manages URL-based filter state so
 * filter selections survive page refreshes and browser navigation.
 */
export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  const params = await searchParams
  const status = (typeof params.status === 'string' ? params.status : undefined) as TicketStatus | undefined
  const priority = (typeof params.priority === 'string' ? params.priority : undefined) as TicketPriority | undefined
  const assigneeId = typeof params.assigneeId === 'string' ? params.assigneeId : undefined
  const keyword = typeof params.keyword === 'string' ? params.keyword : undefined
  const page = Math.max(1, parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1)
  const limit = 20

  const [result, users] = await Promise.all([
    listTickets(session.tenantId, { status, priority, assigneeId, keyword }, page, limit),
    listUsers(session.tenantId),
  ])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">티켓 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            고객 문의 티켓을 관리하고 추적합니다.
          </p>
        </div>
        <Link href="/tickets/new">
          <Button>새 티켓</Button>
        </Link>
      </div>

      {/* Filter bar */}
      <TicketFilters users={users} />

      {/* Ticket grid */}
      {result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-gray-900">티켓이 없습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {keyword || status || priority || assigneeId
              ? '검색 조건에 맞는 티켓이 없습니다. 필터를 조정해 보세요.'
              : '새 티켓을 생성하여 시작하세요.'}
          </p>
          {!keyword && !status && !priority && !assigneeId && (
            <Link href="/tickets/new" className="mt-4">
              <Button variant="outline">첫 티켓 생성하기</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={{ query: { ...params, page: String(page - 1) } }}
                >
                  <Button variant="outline" size="sm">이전</Button>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {page} / {result.totalPages} 페이지 (총 {result.total}건)
              </span>
              {page < result.totalPages && (
                <Link
                  href={{ query: { ...params, page: String(page + 1) } }}
                >
                  <Button variant="outline" size="sm">다음</Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
