/**
 * Comment service — the only place in the codebase that may directly query the
 * `ticketComments` table.  Every function accepts `tenantId` as its first
 * argument so that multi-tenant row isolation is enforced at the service boundary.
 *
 * listComments joins the `author` (users) relation via leftJoin so that the
 * caller receives comments with their author info without additional queries.
 */

import { eq, and, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ticketComments, users } from '@/lib/db/schema'
import { NotFoundError, ForbiddenError, AppError } from '@/lib/errors'
import type { TicketComment, UserRole } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommentWithAuthor = TicketComment & {
  author: {
    id: string
    name: string
    email: string
    role: UserRole
  } | null
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * Returns all comments for a given ticket within the tenant, ordered by
 * creation date ascending (oldest first) for natural conversation flow.
 * Each comment includes the author's basic profile via a leftJoin on users.
 */
export async function listComments(
  tenantId: string,
  ticketId: string
): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      comment: ticketComments,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
    .from(ticketComments)
    .leftJoin(users, eq(ticketComments.authorId, users.id))
    .where(
      and(
        eq(ticketComments.tenantId, tenantId),
        eq(ticketComments.ticketId, ticketId)
      )
    )
    .orderBy(asc(ticketComments.createdAt))

  return rows.map((row) => ({
    ...row.comment,
    author: row.author?.id ? row.author : null,
  }))
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Creates a new comment on a ticket within the given tenant.
 * The `isInternal` flag marks notes visible only to agents and admins.
 */
export async function createComment(
  tenantId: string,
  ticketId: string,
  authorId: string,
  content: string,
  isInternal = false
): Promise<TicketComment> {
  const [comment] = await db
    .insert(ticketComments)
    .values({
      tenantId,
      ticketId,
      authorId,
      content,
      isInternal,
    })
    .returning()

  if (!comment) {
    throw new AppError('댓글 생성에 실패했습니다.')
  }

  return comment
}

/**
 * Permanently removes a comment from the database.
 * Only the comment author or an admin may delete a comment.
 *
 * @throws {NotFoundError} when the comment does not exist in this tenant.
 * @throws {ForbiddenError} when the requester is neither the author nor an admin.
 */
export async function deleteComment(
  tenantId: string,
  commentId: string,
  requesterId: string,
  requesterRole: UserRole
): Promise<void> {
  const [comment] = await db
    .select()
    .from(ticketComments)
    .where(
      and(
        eq(ticketComments.id, commentId),
        eq(ticketComments.tenantId, tenantId)
      )
    )
    .limit(1)

  if (!comment) {
    throw new NotFoundError('댓글')
  }

  if (comment.authorId !== requesterId && requesterRole !== 'admin') {
    throw new ForbiddenError('본인의 댓글만 삭제할 수 있습니다.')
  }

  const deleted = await db
    .delete(ticketComments)
    .where(
      and(
        eq(ticketComments.id, commentId),
        eq(ticketComments.tenantId, tenantId)
      )
    )
    .returning({ id: ticketComments.id })

  if (!deleted.length) {
    throw new AppError('댓글 삭제에 실패했습니다.')
  }
}
