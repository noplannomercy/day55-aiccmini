'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'

interface RuleToggleProps {
  ruleId: string
  isActive: boolean
}

/**
 * Inline toggle for enabling/disabling an automation rule.
 *
 * Performs an optimistic UI update so the switch feels instant, then issues a
 * PATCH request to persist the change. On failure the switch reverts to the
 * previous state and the error is silently absorbed (the user sees the switch
 * snap back, which is sufficient feedback for a boolean toggle).
 */
export function RuleToggle({ ruleId, isActive }: RuleToggleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState(isActive)

  function handleToggle(checked: boolean) {
    // Optimistic update — reflect the new state immediately.
    setOptimistic(checked)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/rules/${ruleId}/toggle`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: checked }),
        })

        if (!res.ok) {
          // Revert on server-side failure.
          setOptimistic(!checked)
          return
        }

        router.refresh()
      } catch {
        // Revert on network failure.
        setOptimistic(!checked)
      }
    })
  }

  return (
    <Switch
      checked={optimistic}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label="규칙 활성화 상태 전환"
    />
  )
}
