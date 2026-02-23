import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { getArticleById } from '@/services/kb.service'
import { TagManager } from '@/components/kb/TagManager'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { NotFoundError } from '@/lib/errors'

interface KBDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * /kb/[id] -- KB article detail page.
 *
 * Displays the full article content with metadata (version, author, dates)
 * and a TagManager component for viewing/editing tags. An edit button is
 * rendered only for users with agent or admin roles.
 */
export default async function KBDetailPage({ params }: KBDetailPageProps) {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
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

  const canEdit = session.role === 'admin' || session.role === 'agent'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link href="/kb">
        <Button variant="ghost" size="sm">
          &larr; Back to Knowledge Base
        </Button>
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-2xl font-bold text-gray-900">
            {article.title}
          </h1>
          <Badge variant="outline">v{article.version}</Badge>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid gap-4 sm:grid-cols-2">
        <MetadataItem label="Author" value={article.author.name || '-'} />
        <MetadataItem
          label="Created"
          value={article.createdAt ? formatDateTime(article.createdAt) : '-'}
        />
        <MetadataItem
          label="Updated"
          value={article.updatedAt ? formatDateTime(article.updatedAt) : '-'}
        />
      </div>

      {/* Content */}
      <div className="rounded-lg border p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {article.content}
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Tags</h2>
        <TagManager
          articleId={article.id}
          tags={article.tags ?? []}
          canEdit={canEdit}
        />
      </div>

      {/* Edit button */}
      {canEdit && (
        <Link href={`/kb/${article.id}/edit`}>
          <Button variant="outline">Edit Article</Button>
        </Link>
      )}
    </div>
  )
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  )
}
