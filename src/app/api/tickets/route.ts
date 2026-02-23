/**
 * /api/tickets — collection-level resource handler.
 *
 * GET  — returns a paginated list of tickets for the session user's tenant.
 *         Supports optional query params: status, priority, assigneeId,
 *         keyword, page, limit.  Any authenticated user may list tickets.
 *
 * POST — creates a new ticket inside the tenant.
 *         Any authenticated user may create a ticket.
 *         Body: { title: string, description: string, priority?: TicketPriority, customerId?: string }
 *
 * Both handlers follow the same pipeline:
 *   authenticate → validate input → delegate to service → respond.
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/errors'
import { listTickets, createTicket } from '@/services/ticket.service'
import { ticketStatusEnum, ticketPriorityEnum } from '@/lib/db/schema'
import type { TicketStatus, TicketPriority } from '@/types'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    const { searchParams } = request.nextUrl

    // Parse and validate optional filter params.
    const status = searchParams.get('status') as TicketStatus | null
    if (
      status &&
      !ticketStatusEnum.enumValues.includes(status as TicketStatus)
    ) {
      throw new ValidationError(
        `status는 ${ticketStatusEnum.enumValues.join(', ')} 중 하나여야 합니다.`
      )
    }

    const priority = searchParams.get('priority') as TicketPriority | null
    if (
      priority &&
      !ticketPriorityEnum.enumValues.includes(priority as TicketPriority)
    ) {
      throw new ValidationError(
        `priority는 ${ticketPriorityEnum.enumValues.join(', ')} 중 하나여야 합니다.`
      )
    }

    const assigneeId = searchParams.get('assigneeId') || undefined
    const keyword = searchParams.get('keyword') || undefined

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20)
    )

    const result = await listTickets(
      sessionUser.tenantId,
      {
        status: status || undefined,
        priority: priority || undefined,
        assigneeId,
        keyword,
      },
      page,
      limit
    )

    return Response.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    // Parse body — guard against malformed JSON.
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

    // Validate required fields.
    if (typeof title !== 'string' || !title.trim()) {
      throw new ValidationError('title 필드가 필요합니다.')
    }

    if (typeof description !== 'string' || !description.trim()) {
      throw new ValidationError('description 필드가 필요합니다.')
    }

    // Validate optional fields.
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

    const ticket = await createTicket(
      sessionUser.tenantId,
      {
        title: title.trim(),
        description: description.trim(),
        priority: priority as TicketPriority | undefined,
        customerId:
          typeof customerId === 'string' ? customerId : undefined,
      },
      sessionUser.id
    )

    return Response.json(ticket, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
