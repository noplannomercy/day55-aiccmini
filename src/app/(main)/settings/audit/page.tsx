import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSessionUser } from '@/lib/auth'
import { listAuditLogs } from '@/services/audit.service'
import { AuditLogTable } from '@/components/audit/AuditLogTable'
import { AuditLogFilters } from '@/components/audit/AuditLogFilters'
import { AuditLogPagination } from '@/components/audit/AuditLogPagination'

/**
 * /settings/audit -- admin-only audit log viewer.
 *
 * Fetches paginated audit logs directly from the service layer rather than
 * through an internal API route, following the same pattern used in the
 * /settings/users page. This avoids an unnecessary HTTP round-trip and keeps
 * the session context without re-forwarding headers.
 *
 * Access control:
 *   1. getSessionUser() validates the Supabase session cookie.
 *   2. Non-admin roles are redirected to /dashboard.
 *
 * Filtering:
 *   - action: partial text match on the action column.
 *   - dateFrom / dateTo: ISO date strings to bound the createdAt range.
 *   - page: 1-based page number (defaults to 1).
 */

const PAGE_SIZE = 20

interface AuditPageProps {
  searchParams: Promise<{
    action?: string
    dateFrom?: string
    dateTo?: string
    page?: string
  }>
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  if (session.role !== 'admin') {
    redirect('/dashboard')
  }

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const filters = {
    action: params.action || undefined,
    dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
    dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
  }

  const result = await listAuditLogs(session.tenantId, filters, page, PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">감사 로그</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          시스템 내 모든 변경 이력을 확인합니다.
        </p>
      </div>

      {/* Filters */}
      <Suspense>
        <AuditLogFilters />
      </Suspense>

      {/* Audit log table */}
      <AuditLogTable logs={result.data} />

      {/* Pagination */}
      <Suspense>
        <AuditLogPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
        />
      </Suspense>
    </div>
  )
}
