/**
 * /api/tickets/[id]/comments/[commentId] — individual comment resource handler.
 *
 * DELETE — permanently removes a comment.
 *          Only the comment author or an admin may delete.
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { handleApiError, UnauthorizedError } from '@/lib/errors'
import { deleteComment } from '@/services/comment.service'

type RouteContext = { params: Promise<{ id: string; commentId: string }> }

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    const { commentId } = await context.params

    await deleteComment(
      sessionUser.tenantId,
      commentId,
      sessionUser.id,
      sessionUser.role
    )

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
