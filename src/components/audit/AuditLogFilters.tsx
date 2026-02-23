'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

/**
 * Client-side filter form for the audit log page.
 *
 * Filter values are persisted as URL search params so that:
 *   - The page is bookmarkable / shareable with active filters.
 *   - The Server Component re-fetches data on navigation without client state.
 *   - Browser back/forward respects the filter history.
 */
export function AuditLogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const action = searchParams.get('action') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }

      // Reset to page 1 when filters change to avoid showing an empty page
      // when the new result set has fewer pages than the current page number.
      params.delete('page')

      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  function handleReset() {
    router.push('?')
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Action text filter */}
      <div className="grid gap-1.5">
        <Label htmlFor="filter-action" className="text-xs">
          액션
        </Label>
        <Input
          id="filter-action"
          type="text"
          placeholder="예: ticket.update"
          defaultValue={action}
          className="w-44"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParams({ action: e.currentTarget.value })
            }
          }}
          onBlur={(e) => {
            if (e.target.value !== action) {
              updateParams({ action: e.target.value })
            }
          }}
        />
      </div>

      {/* Date from */}
      <div className="grid gap-1.5">
        <Label htmlFor="filter-date-from" className="text-xs">
          시작일
        </Label>
        <Input
          id="filter-date-from"
          type="date"
          defaultValue={dateFrom}
          className="w-40"
          onChange={(e) => updateParams({ dateFrom: e.target.value })}
        />
      </div>

      {/* Date to */}
      <div className="grid gap-1.5">
        <Label htmlFor="filter-date-to" className="text-xs">
          종료일
        </Label>
        <Input
          id="filter-date-to"
          type="date"
          defaultValue={dateTo}
          className="w-40"
          onChange={(e) => updateParams({ dateTo: e.target.value })}
        />
      </div>

      {/* Reset */}
      <Button variant="outline" size="sm" onClick={handleReset}>
        초기화
      </Button>
    </div>
  )
}
