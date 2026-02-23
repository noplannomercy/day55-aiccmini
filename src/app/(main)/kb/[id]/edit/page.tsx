import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { getArticleById } from '@/services/kb.service'
import { Button } from '@/components/ui/button'
import { NotFoundError } from '@/lib/errors'
import { KBEditForm } from './KBEditForm'

interface KBEditPageProps {
  params: Promise<{ id: string }>
}

/**
 * /kb/[id]/edit -- KB article edit page.
 *
 * Server Component shell that verifies the user has agent or admin role,
 * loads the article data, and renders the KBEditForm client component
 * for the actual editing interaction.
 */
export default async function KBEditPage({ params }: KBEditPageProps) {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  if (session.role !== 'admin' && session.role !== 'agent') {
    redirect('/kb')
  }

  const { id } = await params

  let article
  try {
    article = await getArticleById(session.tenantId, id)
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound()
    }
    throw err
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link href={`/kb/${article.id}`}>
        <Button variant="ghost" size="sm">
          &larr; Back to Article
        </Button>
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>

      <KBEditForm article={article} />
    </div>
  )
}
