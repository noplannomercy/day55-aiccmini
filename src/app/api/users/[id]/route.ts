/**
 * /api/users/[id] — individual user resource handler.
 *
 * GET    — returns a single user's details.
 *           Any authenticated user within the tenant may read user profiles.
 *           (Agents need to look up teammates when assigning tickets, etc.)
 *
 * PATCH  — updates a user's role OR their active/inactive status.
 *           Restricted to admin role.
 *           Accepted bodies (exactly one field per request):
 *             { role: UserRole }
 *             { isActive: boolean }
 *
 * DELETE — permanently removes the user from the tenant.
 *           Restricted to admin role.
 *           An admin may not delete their own account to prevent accidental
 *           lockout of the last admin.
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  AppError,
} from '@/lib/errors'
import {
  getUserById,
  updateUserRole,
  toggleUserActive,
  deleteUser,
} from '@/services/user.service'
import { userRoleEnum } from '@/lib/db/schema'
import type { UserRole } from '@/types'

// Next.js App Router passes dynamic segment params as the second argument.
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
    const user = await getUserById(sessionUser.tenantId, id)

    return Response.json(user)
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

    if (sessionUser.role !== 'admin') {
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

    const { role, isActive } = body as Record<string, unknown>

    // Require at least one updatable field to avoid silent no-ops.
    if (role === undefined && isActive === undefined) {
      throw new ValidationError('role 또는 isActive 중 하나는 필수입니다.')
    }

    // Reject simultaneous updates to both fields: applying them in two separate
    // DB writes is non-atomic and can leave the record in a partially-updated
    // state if the second write fails after the first has committed.
    if (role !== undefined && isActive !== undefined) {
      throw new ValidationError('role과 isActive는 동시에 변경할 수 없습니다.')
    }

    // Validate each provided field before touching the database.
    if (role !== undefined) {
      if (typeof role !== 'string' || !userRoleEnum.enumValues.includes(role as UserRole)) {
        throw new ValidationError(
          `role은 ${userRoleEnum.enumValues.join(', ')} 중 하나여야 합니다.`
        )
      }
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      throw new ValidationError('isActive는 boolean이어야 합니다.')
    }

    const { id } = await context.params

    // Prevent an admin from modifying their own role or active status.
    // Allowing self-demotion could lock the admin out; allowing self-deactivation
    // could prevent them from recovering access entirely.
    if (sessionUser.id === id) {
      throw new AppError(
        '자기 자신의 역할이나 활성 상태는 변경할 수 없습니다.',
        'SELF_MODIFY_FORBIDDEN',
        400
      )
    }

    // Exactly one of `role` or `isActive` is defined at this point
    // (the simultaneous-update case was rejected above).
    let updatedUser

    if (role !== undefined) {
      updatedUser = await updateUserRole(
        sessionUser.tenantId,
        id,
        role as UserRole
      )
    } else {
      updatedUser = await toggleUserActive(
        sessionUser.tenantId,
        id,
        isActive as boolean
      )
    }

    return Response.json(updatedUser)
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

    // Prevent self-deletion: an admin cannot remove their own account.
    // This guards against accidental lockout when they are the only admin.
    if (sessionUser.id === id) {
      throw new AppError(
        '자기 자신의 계정은 삭제할 수 없습니다.',
        'SELF_DELETE_FORBIDDEN',
        400
      )
    }

    await deleteUser(sessionUser.tenantId, id)

    // 204 No Content — the resource no longer exists, no body needed.
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
