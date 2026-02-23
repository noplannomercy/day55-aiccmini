import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { KBCreateForm } from './KBCreateForm'

/**
 * /kb/new — create a new KB article (agent and admin only).
 */
export default async function KBNewPage() {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  if (session.role === 'viewer') {
    redirect('/kb')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Article</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          새 지식베이스 문서를 작성합니다.
        </p>
      </div>

      <KBCreateForm />
    </div>
  )
}
