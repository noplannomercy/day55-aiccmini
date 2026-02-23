'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RuleToggle } from '@/components/rules/RuleToggle'
import { RuleForm, type RuleFormData } from '@/components/rules/RuleForm'
import { formatDate } from '@/lib/utils'
import type { AutoRule } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RuleListProps {
  rules: AutoRule[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Summarises the conditions JSONB into a concise label for the table cell.
 * Shows the first condition and a count of remaining items.
 */
function summariseConditions(conditions: unknown): string {
  if (!conditions) return '-'

  if (Array.isArray(conditions)) {
    if (conditions.length === 0) return '-'
    const first = conditions[0] as { type?: string; value?: string }
    const label = `${first.type ?? '?'}: ${first.value ?? '?'}`
    return conditions.length > 1
      ? `${label} (+${conditions.length - 1})`
      : label
  }

  // Object form — { keywords: [...], priority: '...' }
  const obj = conditions as Record<string, unknown>
  const parts: string[] = []

  if (obj.keywords && Array.isArray(obj.keywords) && obj.keywords.length > 0) {
    parts.push(`keyword: ${obj.keywords[0]}`)
  }
  if (obj.priority) {
    parts.push(`priority: ${String(obj.priority)}`)
  }

  if (parts.length === 0) return '-'

  const label = parts[0]
  return parts.length > 1 ? `${label} (+${parts.length - 1})` : label
}

/**
 * Summarises the actions JSONB into a concise label for the table cell.
 */
function summariseActions(actions: unknown): string {
  if (!actions) return '-'

  if (Array.isArray(actions)) {
    if (actions.length === 0) return '-'
    const first = actions[0] as { type?: string }
    return first.type ?? '-'
  }

  // Object form — { assignTo: '...', setStatus: '...' }
  const obj = actions as Record<string, unknown>
  if (obj.assignTo) return 'assign_agent'
  if (obj.setStatus) return 'change_status'

  return '-'
}

// ---------------------------------------------------------------------------
// Delete Confirmation Dialog
// ---------------------------------------------------------------------------

interface DeleteRuleDialogProps {
  ruleId: string
  ruleName: string
  onDeleted: () => void
}

function DeleteRuleDialog({ ruleId, ruleName, onDeleted }: DeleteRuleDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [apiError, setApiError] = useState<string | null>(null)

  async function handleDelete() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rules/${ruleId}`, { method: 'DELETE' })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setApiError(
            (data as { message?: string }).message ?? '삭제에 실패했습니다.'
          )
          return
        }

        setOpen(false)
        onDeleted()
      } catch {
        setApiError('네트워크 오류가 발생했습니다.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          삭제
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>규칙 삭제</DialogTitle>
          <DialogDescription>
            <strong>{ruleName}</strong> 규칙을 영구적으로 삭제합니다. 이 작업은
            되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <p className="text-sm text-destructive" role="alert">
            {apiError}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? '삭제 중...' : '삭제 확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit Rule Dialog
// ---------------------------------------------------------------------------

interface EditRuleDialogProps {
  rule: AutoRule
  onUpdated: () => void
}

function EditRuleDialog({ rule, onUpdated }: EditRuleDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  async function handleSubmit(data: RuleFormData) {
    setIsLoading(true)
    setApiError(null)

    try {
      const res = await fetch(`/api/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setApiError(
          (body as { message?: string }).message ?? '수정에 실패했습니다.'
        )
        return
      }

      setOpen(false)
      onUpdated()
    } catch {
      setApiError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setApiError(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          수정
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>규칙 수정</DialogTitle>
          <DialogDescription>
            자동화 규칙의 조건과 액션을 수정합니다.
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <p className="text-sm text-destructive" role="alert">
            {apiError}
          </p>
        )}

        <RuleForm rule={rule} onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Renders the automation rules table with inline toggle, edit dialog, and
 * delete confirmation. All mutations issue requests to the API and then call
 * router.refresh() to keep server-rendered data in sync.
 */
export function RuleList({ rules }: RuleListProps) {
  const router = useRouter()
  const [, startRefreshTransition] = useTransition()

  function handleRefresh() {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>조건</TableHead>
            <TableHead>액션</TableHead>
            <TableHead>활성</TableHead>
            <TableHead>우선순위</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                등록된 규칙이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {summariseConditions(rule.conditions)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {summariseActions(rule.actions)}
                </TableCell>
                <TableCell>
                  <RuleToggle
                    ruleId={rule.id}
                    isActive={rule.isActive ?? true}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {rule.priority ?? 0}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {rule.createdAt ? formatDate(rule.createdAt) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditRuleDialog rule={rule} onUpdated={handleRefresh} />
                    <DeleteRuleDialog
                      ruleId={rule.id}
                      ruleName={rule.name}
                      onDeleted={handleRefresh}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
