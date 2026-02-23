/**
 * /api/users — collection-level resource handler.
 *
 * GET  — returns the full list of users for the session user's tenant.
 *         Restricted to admin role.
 *
 * POST — creates a new user inside the tenant.
 *         Restricted to admin role.
 *         Body: { email: string, name: string, role: UserRole, password: string }
 *
 * Both handlers follow the same pipeline:
 *   authenticate → authorise → validate input → delegate to service → respond.
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/errors'
import { listUsers, createUser } from '@/services/user.service'
import { userRoleEnum } from '@/lib/db/schema'
import type { UserRole } from '@/types'

export async function GET(): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    if (sessionUser.role !== 'admin') {
      throw new ForbiddenError()
    }

    const users = await listUsers(sessionUser.tenantId)

    return Response.json(users)
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

    if (sessionUser.role !== 'admin') {
      throw new ForbiddenError()
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

    const { email, name, role, password } = body as Record<string, unknown>

    // Validate required fields with clear per-field messages.
    if (typeof email !== 'string' || !email.trim()) {
      throw new ValidationError('email 필드가 필요합니다.')
    }

    if (typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('name 필드가 필요합니다.')
    }

    if (typeof role !== 'string' || !userRoleEnum.enumValues.includes(role as UserRole)) {
      throw new ValidationError(
        `role 필드는 ${userRoleEnum.enumValues.join(', ')} 중 하나여야 합니다.`
      )
    }

    if (typeof password !== 'string' || password.length < 8) {
      throw new ValidationError('password는 8자 이상이어야 합니다.')
    }

    const newUser = await createUser(sessionUser.tenantId, {
      email: email.trim(),
      name: name.trim(),
      role: role as UserRole,
      password,
    })

    return Response.json(newUser, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
