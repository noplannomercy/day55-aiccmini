'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User } from '@/types'

interface TicketAssignActionsProps {
  ticketId: string
  currentAssigneeId: string | null
  users: User[]
}

/**
 * Assignee selection control for a ticket.
 *
 * Renders a select dropdown populated with tenant users and an "Assign"
 * button. The selected user is submitted via PATCH to the assign endpoint.
 */
export function TicketAssignActions({
  ticketId,
  currentAssigneeId,
  users,
}: TicketAssignActionsProps) {
  const router = useRouter()
  const [selectedUserId, setSelectedUserId] = useState(currentAssigneeId ?? '')
  const [isLoading, setIsLoading] = useState(false)

  async function handleAssign() {
    if (!selectedUserId) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: selectedUserId }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? '담당자 배정에 실패했습니다.')
      }

      router.refresh()
    } catch (err) {
      console.error('[TicketAssignActions]', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Assign:</span>
      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select assignee" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading || !selectedUserId || selectedUserId === currentAssigneeId}
        onClick={handleAssign}
      >
        {isLoading ? 'Assigning...' : 'Assign'}
      </Button>
    </div>
  )
}
