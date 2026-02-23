'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User } from '@/types'

interface TicketFiltersProps {
  users?: User[]
}

/**
 * Filter bar for the ticket list page.
 *
 * Reads current filter state from URL search params and updates the URL
 * on change so that server-side filtering can use the same params.
 * This keeps the filter state shareable via URL and compatible with
 * browser back/forward navigation.
 */
export function TicketFilters({ users }: TicketFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const keyword = searchParams.get('keyword') ?? ''
  const status = searchParams.get('status') ?? ''
  const priority = searchParams.get('priority') ?? ''
  const assigneeId = searchParams.get('assigneeId') ?? ''

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      // Reset to page 1 when filters change
      params.delete('page')

      router.push(`?${params.toString()}`)
    },
    [router, searchParams],
  )

  function handleClearFilters() {
    router.push('?')
  }

  const hasFilters = keyword || status || priority || assigneeId

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Keyword search */}
      <Input
        placeholder="키워드 검색..."
        value={keyword}
        onChange={(e) => updateParams('keyword', e.target.value)}
        className="w-48"
      />

      {/* Status filter */}
      <Select
        value={status}
        onValueChange={(v) => updateParams('status', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority filter */}
      <Select
        value={priority}
        onValueChange={(v) => updateParams('priority', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="우선순위" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 우선순위</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>

      {/* Assignee filter */}
      {users && users.length > 0 && (
        <Select
          value={assigneeId}
          onValueChange={(v) => updateParams('assigneeId', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="담당자" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 담당자</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          필터 초기화
        </Button>
      )}
    </div>
  )
}
