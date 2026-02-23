import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { listRules } from '@/services/rule.service'
import { RulesPageClient } from '@/components/rules/RulesPageClient'

/**
 * /settings/rules -- admin-only automation rule management page.
 *
 * Data is fetched directly from the service layer (same pattern as /settings/users)
 * to avoid redundant HTTP round-trips within the same process.
 *
 * Access control:
 *   1. getSessionUser() validates the Supabase session cookie.
 *   2. Non-admin roles are redirected to /dashboard immediately.
 */
export default async function RulesPage() {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  if (session.role !== 'admin') {
    redirect('/dashboard')
  }

  const rules = await listRules(session.tenantId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">자동화 규칙</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          티켓 생성 시 자동으로 적용되는 조건-액션 규칙을 관리합니다.
        </p>
      </div>

      <RulesPageClient rules={rules} />
    </div>
  )
}
