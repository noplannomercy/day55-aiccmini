'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface AuditLogPaginationProps {
  page: number
  totalPages: number
  total: number
}

/**
 * Simple prev/next pagination for audit logs.
 *
 * Navigation is URL-based (searchParams) so the Server Component can
 * read the page parameter directly without any client-side data fetching.
 */
export function AuditLogPagination({
  page,
  totalPages,
  total,
}: AuditLogPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (newPage <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(newPage))
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        전체 {total}건 / {page} / {totalPages} 페이지
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
        >
          이전
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  )
}
