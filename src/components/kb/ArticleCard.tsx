import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import type { KBArticle } from '@/types'

interface ArticleCardProps {
  article: KBArticle & { author: { name: string } }
}

/**
 * Compact card for displaying a KB article summary in list/grid views.
 *
 * The title links to the article detail page. Tags are rendered as
 * secondary badges, and version/author/date metadata is shown in
 * the card footer area.
 */
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/kb/${article.id}`} className="hover:underline">
            <CardTitle className="text-sm leading-snug line-clamp-2">
              {article.title}
            </CardTitle>
          </Link>
          <Badge variant="outline" className="shrink-0">
            v{article.version}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {article.author.name}
          </span>
          {article.createdAt && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(article.createdAt)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
