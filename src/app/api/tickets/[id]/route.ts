/**
 * /api/tickets/[id] — individual ticket resource handler.
 *
 * GET    — returns a single ticket with relations (assignee, customer, createdBy).
 *           Any authenticated user within the tenant may read ticket details.
 *
 * PATCH  — updates a ticket's mutable fields (title, description, priority, customerId).
 *           Restricted to admin or agent roles.
 *           Body: { title?, description?, priority?, customerId? }
 *
 * DELETE — permanently removes the ticket.
 *           Restricted to admin role.
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/errors'
import {
  getTicketById,
  updateTicket,
  deleteTicket,
} from '@/services/ticket.service'
import { ticketPriorityEnum } from '@/lib/db/schema'
import type { TicketPriority } from '@/types'

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
    const ticket = await getTicketById(sessionUser.tenantId, id)

    return Response.json(ticket)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    // Only admin and agent roles may update tickets.
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

    const { title, description, priority, customerId } = body as Record<
      string,
      unknown
    >

    // Require at least one updatable field.
    if (
      title === undefined &&
      description === undefined &&
      priority === undefined &&
      customerId === undefined
    ) {
      throw new ValidationError(
        'title, description, priority, customerId 중 하나 이상 필요합니다.'
      )
    }

    // Validate each provided field.
    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      throw new ValidationError('title은 비어 있을 수 없습니다.')
    }

    if (
      description !== undefined &&
      (typeof description !== 'string' || !description.trim())
    ) {
      throw new ValidationError('description은 비어 있을 수 없습니다.')
    }

    if (
      priority !== undefined &&
      (typeof priority !== 'string' ||
        !ticketPriorityEnum.enumValues.includes(priority as TicketPriority))
    ) {
      throw new ValidationError(
        `priority는 ${ticketPriorityEnum.enumValues.join(', ')} 중 하나여야 합니다.`
      )
    }

    if (
      customerId !== undefined &&
      customerId !== null &&
      typeof customerId !== 'string'
    ) {
      throw new ValidationError('customerId는 문자열이어야 합니다.')
    }

    const { id } = await context.params

    const updated = await updateTicket(sessionUser.tenantId, id, {
      title: typeof title === 'string' ? title.trim() : undefined,
      description:
        typeof description === 'string' ? description.trim() : undefined,
      priority: priority as TicketPriority | undefined,
      customerId: customerId === null ? null : (customerId as string | undefined),
    })

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    if (sessionUser.role !== 'admin') {
      throw new ForbiddenError()
    }

    const { id } = await context.params
    await deleteTicket(sessionUser.tenantId, id)

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
