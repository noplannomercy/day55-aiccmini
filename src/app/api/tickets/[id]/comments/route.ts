/**
 * /api/tickets/[id]/comments — ticket comments collection handler.
 *
 * GET  — returns all comments for a ticket.
 *         Viewers see only non-internal comments; agents and admins see all.
 *
 * POST — creates a new comment on a ticket.
 *         Body: { content: string, isInternal?: boolean }
 *         isInternal flag is only allowed for agent and admin roles.
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/errors'
import { listComments, createComment } from '@/services/comment.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    const { id } = await context.params
    const comments = await listComments(sessionUser.tenantId, id)

    // Viewers must not see internal comments.
    const filtered =
      sessionUser.role === 'viewer'
        ? comments.filter((c) => !c.isInternal)
        : comments

    return Response.json(filtered)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      throw new ValidationError('요청 본문이 유효한 JSON이 아닙니다.')
    }

    if (typeof body !== 'object' || body === null) {
      throw new ValidationError('요청 본문은 JSON 객체여야 합니다.')
    }

    const { content, isInternal } = body as Record<string, unknown>

    if (typeof content !== 'string' || !content.trim()) {
      throw new ValidationError('content는 비어 있을 수 없습니다.')
    }

    // Only agent and admin may create internal comments.
    if (isInternal && sessionUser.role === 'viewer') {
      throw new ForbiddenError('내부 댓글은 상담원 이상만 작성할 수 있습니다.')
    }

    if (isInternal !== undefined && typeof isInternal !== 'boolean') {
      throw new ValidationError('isInternal은 boolean이어야 합니다.')
    }

    const { id } = await context.params

    const comment = await createComment(
      sessionUser.tenantId,
      id,
      sessionUser.id,
      content.trim(),
      isInternal === true
    )

    return Response.json(comment, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
