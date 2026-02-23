/**
 * /api/tickets/[id]/status — ticket status transition handler.
 *
 * PATCH — changes the ticket's status.
 *          Restricted to admin and agent roles.
 *          Body: { status: TicketStatus }
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/errors'
import { changeTicketStatus } from '@/services/ticket.service'
import { ticketStatusEnum } from '@/lib/db/schema'
import type { TicketStatus } from '@/types'

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

    // Only admin and agent roles may change ticket status.
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

    const { status } = body as Record<string, unknown>

    if (
      typeof status !== 'string' ||
      !ticketStatusEnum.enumValues.includes(status as TicketStatus)
    ) {
      throw new ValidationError(
        `status는 ${ticketStatusEnum.enumValues.join(', ')} 중 하나여야 합니다.`
      )
    }

    const { id } = await context.params
    const updated = await changeTicketStatus(
      sessionUser.tenantId,
      id,
      status as TicketStatus
    )

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
