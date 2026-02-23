'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { TicketStatus } from '@/types'

interface TicketStatusActionsProps {
  ticketId: string
  currentStatus: TicketStatus
}

const allStatuses: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

/**
 * Inline status transition buttons for a ticket.
 *
 * Only statuses different from the current one are shown, preventing
 * no-op API calls. After a successful status change the page is refreshed
 * so the server component re-fetches the updated data.
 */
export function TicketStatusActions({ ticketId, currentStatus }: TicketStatusActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleStatusChange(status: TicketStatus) {
    setIsLoading(true)

    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? '상태 변경에 실패했습니다.')
      }

      router.refresh()
    } catch (err) {
      console.error('[TicketStatusActions]', err)
    } finally {
      setIsLoading(false)
    }
  }

  const availableStatuses = allStatuses.filter((s) => s.value !== currentStatus)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Status:</span>
      {availableStatuses.map((s) => (
        <Button
          key={s.value}
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => handleStatusChange(s.value)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  )
}
