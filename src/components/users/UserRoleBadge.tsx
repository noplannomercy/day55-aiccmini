import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/types'

interface UserRoleBadgeProps {
  role: UserRole
}

/**
 * Displays a user's role as a colour-coded badge.
 *
 * Colour semantics:
 *   admin  — destructive (red)  : highest-privilege role, visually prominent
 *   agent  — default (blue/primary) : standard operational role
 *   viewer — outline (grey)     : read-only role, visually de-emphasised
 *
 * Intentionally a pure presentational component with no state or side effects
 * so it can be safely rendered in both Server and Client Components.
 */
export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const variantMap = {
    admin: 'destructive',
    agent: 'default',
    viewer: 'outline',
  } as const

  const labelMap: Record<UserRole, string> = {
    admin: '관리자',
    agent: '에이전트',
    viewer: '뷰어',
  }

  return (
    <Badge variant={variantMap[role]}>
      {labelMap[role]}
    </Badge>
  )
}
