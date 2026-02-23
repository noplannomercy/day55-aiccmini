'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommentFormProps {
  ticketId: string
  userRole: string
  onCommentAdded?: () => void
}

/**
 * Client component for submitting new comments on a ticket.
 *
 * POSTs to /api/tickets/[ticketId]/comments, then refreshes the server
 * component tree via router.refresh() so the CommentList picks up the
 * newly created comment without a full page navigation.
 *
 * The "isInternal" checkbox is only rendered for agent and admin roles.
 */
export function CommentForm({ ticketId, userRole, onCommentAdded }: CommentFormProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canMarkInternal = userRole === 'agent' || userRole === 'admin'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = content.trim()
    if (!trimmed) return

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          ...(canMarkInternal ? { isInternal } : {}),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        const message = errorData?.error ?? `Error ${res.status}`
        throw new Error(message)
      }

      setContent('')
      setIsInternal(false)
      router.refresh()
      onCommentAdded?.()
    } catch (err) {
      console.error('Failed to create comment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
        required
        minLength={1}
      />

      <div className="flex items-center justify-between">
        <div>
          {canMarkInternal && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                disabled={isSubmitting}
                className="size-4 rounded border-gray-300"
              />
              <span className="text-muted-foreground">Internal note</span>
            </label>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting || !content.trim()} size="sm">
          {isSubmitting ? 'Submitting...' : 'Add Comment'}
        </Button>
      </div>
    </form>
  )
}
