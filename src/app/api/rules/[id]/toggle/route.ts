/**
 * /api/rules/[id]/toggle — toggles the isActive flag on an automation rule.
 *
 * PATCH — flips the rule's isActive boolean.
 *          Restricted to admin role.
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/errors'
import { toggleRule } from '@/services/rule.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(
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
    const rule = await toggleRule(sessionUser.tenantId, id)

    return Response.json(rule)
  } catch (error) {
    return handleApiError(error)
  }
}
