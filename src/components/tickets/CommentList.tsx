import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import type { CommentWithAuthor } from '@/services/comment.service'

interface CommentListProps {
  comments: CommentWithAuthor[]
  currentUserRole: string
}

/**
 * Renders a chronologically ordered list of ticket comments.
 *
 * Internal notes (isInternal = true) are visually distinguished with an amber
 * background and an "Internal Note" badge. They are only rendered when the
 * current user has an agent or admin role -- the filtering is performed here
 * as a defensive UI-layer guard in addition to the API-layer filtering.
 */
export function CommentList({ comments, currentUserRole }: CommentListProps) {
  const canSeeInternal = currentUserRole === 'agent' || currentUserRole === 'admin'

  const visibleComments = canSeeInternal
    ? comments
    : comments.filter((c) => !c.isInternal)

  if (visibleComments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No comments yet
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {visibleComments.map((comment) => (
        <div
          key={comment.id}
          className={cn(
            'rounded-lg border p-4',
            comment.isInternal
              ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
              : 'bg-white dark:bg-transparent'
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.author?.name ?? 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">
              {comment.createdAt ? formatRelativeTime(comment.createdAt) : ''}
            </span>
            {comment.isInternal && (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-300"
              >
                Internal Note
              </Badge>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  )
}
