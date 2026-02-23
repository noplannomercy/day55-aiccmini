import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { listUsers } from '@/services/user.service'
import { UserList } from '@/components/users/UserList'

/**
 * /settings/users — admin-only user management page.
 *
 * Data is fetched directly from the service layer rather than through an
 * internal fetch() call because:
 *   - Avoids the need for an absolute URL at build time.
 *   - Eliminates a redundant HTTP round-trip within the same process.
 *   - Keeps the authentication context (session cookies) without re-forwarding
 *     request headers.
 *
 * Access control:
 *   1. getSessionUser() validates the Supabase session cookie.
 *   2. Non-admin roles are redirected to /dashboard immediately, before any
 *      data query is executed.
 */
export default async function UsersPage() {
  const session = await getSessionUser()

  // Unauthenticated requests are handled by the middleware, but we guard here
  // as well in case the middleware check is bypassed during development or
  // edge-runtime cold-starts.
  if (!session) {
    redirect('/login')
  }

  // Strictly enforce admin-only access at the page level.
  if (session.role !== 'admin') {
    redirect('/dashboard')
  }

  const users = await listUsers(session.tenantId)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          테넌트 내 사용자 계정의 역할과 활성화 상태를 관리합니다.
        </p>
      </div>

      {/* User table with inline actions and add-user dialog */}
      <UserList users={users} currentUserId={session.id} />
    </div>
  )
}
