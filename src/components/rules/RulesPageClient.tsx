'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RuleList } from '@/components/rules/RuleList'
import { RuleForm, type RuleFormData } from '@/components/rules/RuleForm'
import type { AutoRule } from '@/types'

interface RulesPageClientProps {
  rules: AutoRule[]
}

/**
 * Client wrapper for the rules management page. Provides the "New Rule"
 * dialog trigger and renders the RuleList table.
 *
 * Separated from the Server Component page so that interactivity (dialog
 * state, fetch calls) stays in client-land while data fetching stays in the
 * server component.
 */
export function RulesPageClient({ rules }: RulesPageClientProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [, startRefreshTransition] = useTransition()

  async function handleCreate(data: RuleFormData) {
    setIsLoading(true)
    setApiError(null)

    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setApiError(
          (body as { message?: string }).message ?? '규칙 생성에 실패했습니다.'
        )
        return
      }

      setOpen(false)
      startRefreshTransition(() => {
        router.refresh()
      })
    } catch {
      setApiError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setApiError(null)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          전체 {rules.length}개
        </p>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>규칙 추가</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>새 자동화 규칙</DialogTitle>
              <DialogDescription>
                조건과 액션을 설정하여 티켓 자동화 규칙을 생성합니다.
              </DialogDescription>
            </DialogHeader>

            {apiError && (
              <p className="text-sm text-destructive" role="alert">
                {apiError}
              </p>
            )}

            <RuleForm onSubmit={handleCreate} isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Rule table */}
      <RuleList rules={rules} />
    </div>
  )
}
