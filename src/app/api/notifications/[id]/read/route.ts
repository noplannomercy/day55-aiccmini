/**
 * /api/notifications/[id]/read — mark a single notification as read.
 *
 * PATCH — marks the notification as read for the current user.
 *          Returns the updated notification.
 *          Throws ForbiddenError if the notification belongs to another user.
 */

import { getSessionUser } from '@/lib/auth'
import { handleApiError, UnauthorizedError } from '@/lib/errors'
import { markAsRead } from '@/services/notification.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    const { id } = await context.params
    const updated = await markAsRead(
      sessionUser.tenantId,
      id,
      sessionUser.id
    )

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
