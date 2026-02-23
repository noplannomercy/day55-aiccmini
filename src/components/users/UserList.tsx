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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserRoleBadge } from '@/components/users/UserRoleBadge'
import { formatDate } from '@/lib/utils'
import type { User, UserRole } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserListProps {
  users: User[]
  /** The ID of the currently authenticated user. Used to prevent self-modification. */
  currentUserId: string
}

interface CreateUserFormData {
  name: string
  email: string
  role: UserRole
  password: string
}

// ---------------------------------------------------------------------------
// Add User Dialog
// ---------------------------------------------------------------------------

/**
 * Modal dialog that collects the data required to create a new user account.
 * Validation is intentionally shallow here — the API layer enforces the full
 * set of business rules and returns field-level error messages that are surfaced
 * to the user via the `apiError` state.
 */
function AddUserDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [apiError, setApiError] = useState<string | null>(null)

  const [form, setForm] = useState<CreateUserFormData>({
    name: '',
    email: '',
    role: 'viewer',
    password: '',
  })

  function handleChange(field: keyof CreateUserFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear previous API error when the user edits any field.
    if (apiError) setApiError(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Reset form state when the dialog is dismissed so reopening shows
      // a blank form, not the previous submission's data.
      setForm({ name: '', email: '', role: 'viewer', password: '' })
      setApiError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Client-side guard: surface missing fields before hitting the network.
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setApiError('이름, 이메일, 비밀번호는 모두 필수입니다.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setApiError(
            (data as { message?: string }).message ??
              '사용자 생성에 실패했습니다.'
          )
          return
        }

        setOpen(false)
        // Refresh the Server Component data without a full page reload.
        router.refresh()
      } catch {
        setApiError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>사용자 추가</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 사용자 추가</DialogTitle>
          <DialogDescription>
            새 계정 정보를 입력하세요. 생성된 계정은 즉시 로그인이 가능합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="add-name">이름</Label>
            <Input
              id="add-name"
              type="text"
              placeholder="홍길동"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          {/* Email */}
          <div className="grid gap-1.5">
            <Label htmlFor="add-email">이메일</Label>
            <Input
              id="add-email"
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          {/* Role */}
          <div className="grid gap-1.5">
            <Label htmlFor="add-role">역할</Label>
            <Select
              value={form.role}
              onValueChange={(v) => handleChange('role', v as UserRole)}
            >
              <SelectTrigger id="add-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">관리자</SelectItem>
                <SelectItem value="agent">에이전트</SelectItem>
                <SelectItem value="viewer">뷰어</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Password */}
          <div className="grid gap-1.5">
            <Label htmlFor="add-password">비밀번호</Label>
            <Input
              id="add-password"
              type="password"
              placeholder="8자 이상"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {/* API-level error */}
          {apiError && (
            <p className="text-sm text-destructive" role="alert">
              {apiError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Delete Confirmation Dialog
// ---------------------------------------------------------------------------

interface DeleteUserDialogProps {
  userId: string
  userName: string
  onDeleted: () => void
}

/**
 * Confirms before issuing an irreversible DELETE request.
 * The delete action is intentionally separated into its own component so that
 * each row's confirm state is isolated and does not bleed across rows.
 */
function DeleteUserDialog({ userId, userName, onDeleted }: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [apiError, setApiError] = useState<string | null>(null)

  async function handleDelete() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })

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
          <DialogTitle>사용자 삭제</DialogTitle>
          <DialogDescription>
            <strong>{userName}</strong> 계정을 영구적으로 삭제합니다. 이 작업은
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
// Main component
// ---------------------------------------------------------------------------

/**
 * Renders the full user management table with inline role-change, active-toggle,
 * and delete actions.
 *
 * All mutation actions issue PATCH / DELETE requests to the API route and then
 * call router.refresh() so the Server Component re-fetches the latest data
 * from the database. This keeps the client state in sync without requiring a
 * full-page reload.
 *
 * Self-modification guard: actions that target the currently authenticated user
 * are rendered as disabled to prevent accidental lock-out or privilege loss.
 * The API also enforces this constraint server-side, but the UI guard provides
 * immediate feedback without a round-trip.
 */
export function UserList({ users, currentUserId }: UserListProps) {
  const router = useRouter()
  // Separate transition for router.refresh() calls triggered after successful mutations.
  const [, startRefreshTransition] = useTransition()
  // Transition that covers the async fetch in each inline mutation handler.
  // isPending drives the disabled state on the row's Select and Switch.
  const [isPending, startTransition] = useTransition()

  // Per-row error surface: replaces alert() with an inline message under the
  // affected row. Only one row can show an error at a time; starting any new
  // action clears the previous error immediately.
  const [rowError, setRowError] = useState<{
    userId: string
    message: string
  } | null>(null)

  function handleRefresh() {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  function handleRoleChange(userId: string, role: UserRole) {
    // Clear any stale error before issuing the new request.
    setRowError(null)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setRowError({
            userId,
            message:
              (data as { message?: string }).message ?? '역할 변경에 실패했습니다.',
          })
          return
        }

        handleRefresh()
      } catch {
        setRowError({ userId, message: '네트워크 오류가 발생했습니다. 다시 시도해 주세요.' })
      }
    })
  }

  function handleActiveToggle(userId: string, isActive: boolean) {
    // Clear any stale error before issuing the new request.
    setRowError(null)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setRowError({
            userId,
            message:
              (data as { message?: string }).message ?? '상태 변경에 실패했습니다.',
          })
          return
        }

        handleRefresh()
      } catch {
        setRowError({ userId, message: '네트워크 오류가 발생했습니다. 다시 시도해 주세요.' })
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          전체 {users.length}명
        </p>
        <AddUserDialog />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>활성 상태</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  사용자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSelf = user.id === currentUserId
                // A mutation is in-flight for this specific row when isPending is true
                // AND this row was the one that triggered the transition.
                const isRowPending = isPending && rowError === null

                return (
                  <TableRow key={user.id}>
                    {/* Name — highlight the current user's own row */}
                    <TableCell className="font-medium">
                      {user.name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (나)
                        </span>
                      )}
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>

                    {/* Role select — disabled for own row or while a mutation is pending */}
                    <TableCell>
                      {isSelf ? (
                        // Read-only badge for the current user's own row;
                        // prevents accidental self-demotion.
                        <UserRoleBadge role={user.role} />
                      ) : (
                        <>
                          {/* controlled so the displayed value always reflects
                              the server-side state after router.refresh() */}
                          <Select
                            value={user.role}
                            onValueChange={(v) =>
                              handleRoleChange(user.id, v as UserRole)
                            }
                            disabled={isRowPending}
                          >
                            <SelectTrigger size="sm" className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">관리자</SelectItem>
                              <SelectItem value="agent">에이전트</SelectItem>
                              <SelectItem value="viewer">뷰어</SelectItem>
                            </SelectContent>
                          </Select>
                          {/* Inline error for this row's last role-change attempt */}
                          {rowError?.userId === user.id && (
                            <p className="text-red-500 text-xs mt-1" role="alert">
                              {rowError.message}
                            </p>
                          )}
                        </>
                      )}
                    </TableCell>

                    {/* Active toggle — disabled for own row or while a mutation is pending */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive ?? true}
                          onCheckedChange={(checked) =>
                            handleActiveToggle(user.id, checked)
                          }
                          disabled={isSelf || isRowPending}
                          aria-label={`${user.name} 활성화 상태 전환`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {user.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                      {/* Inline error surfaced here when the active-toggle fails
                          (rowError is keyed by userId so only this row shows it) */}
                      {rowError?.userId === user.id && (
                        <p className="text-red-500 text-xs mt-1" role="alert">
                          {rowError.message}
                        </p>
                      )}
                    </TableCell>

                    {/* Join date */}
                    <TableCell className="text-muted-foreground">
                      {user.createdAt ? formatDate(user.createdAt) : '-'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {isSelf ? (
                        // Render a disabled placeholder button so the column
                        // width stays consistent and the restriction is clear.
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled
                          title="자기 자신은 삭제할 수 없습니다."
                        >
                          삭제
                        </Button>
                      ) : (
                        <DeleteUserDialog
                          userId={user.id}
                          userName={user.name}
                          onDeleted={handleRefresh}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
