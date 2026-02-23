'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TicketForm, type TicketFormData } from '@/components/tickets/TicketForm'

/**
 * Client wrapper around TicketForm that handles the API call for ticket creation.
 * On success, navigates to the newly created ticket's detail page.
 */
export function CreateTicketForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(data: TicketFormData) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || '티켓 생성에 실패했습니다.')
      }

      const ticket = await res.json()
      router.push(`/tickets/${ticket.id}`)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : '티켓 생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return <TicketForm onSubmit={handleSubmit} isLoading={isLoading} />
}
