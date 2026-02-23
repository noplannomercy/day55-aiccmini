/**
 * /api/notifications — collection-level resource handler.
 *
 * GET   — returns a paginated list of notifications for the current user.
 *          Supports optional query params: page, limit.
 *
 * PATCH — marks all notifications as read for the current user.
 *          Returns { success: true } on completion.
 *
 * Both handlers follow the same pipeline:
 *   authenticate → delegate to service → respond.
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { handleApiError, UnauthorizedError } from '@/lib/errors'
import {
  listNotifications,
  markAllAsRead,
} from '@/services/notification.service'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    const { searchParams } = request.nextUrl

    const page = Math.max(
      1,
      parseInt(searchParams.get('page') ?? '1', 10) || 1
    )
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20)
    )

    const result = await listNotifications(
      sessionUser.tenantId,
      sessionUser.id,
      page,
      limit
    )

    return Response.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    await markAllAsRead(sessionUser.tenantId, sessionUser.id)

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
