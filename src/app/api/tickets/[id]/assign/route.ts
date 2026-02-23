/**
 * /api/tickets/[id]/assign — ticket assignment handler.
 *
 * PATCH — assigns a ticket to a user within the same tenant.
 *          Restricted to admin and agent roles.
 *          Body: { assigneeId: string }
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/errors'
import { assignTicket } from '@/services/ticket.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    // Only admin and agent roles may assign tickets.
    if (sessionUser.role === 'viewer') {
      throw new ForbiddenError()
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

    const { assigneeId } = body as Record<string, unknown>

    if (typeof assigneeId !== 'string' || !assigneeId.trim()) {
      throw new ValidationError('assigneeId 필드가 필요합니다.')
    }

    const { id } = await context.params
    const updated = await assignTicket(
      sessionUser.tenantId,
      id,
      assigneeId.trim()
    )

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
