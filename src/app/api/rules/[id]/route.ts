/**
 * /api/rules/[id] — individual rule resource handler.
 *
 * GET    — returns a single automation rule.
 *           Any authenticated user within the tenant may read rule details.
 *
 * PATCH  — updates a rule's mutable fields (name, conditions, actions, priority).
 *           Restricted to admin role.
 *           Body: { name?, conditions?, actions?, priority? }
 *
 * DELETE — permanently removes the rule.
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
  getRuleById,
  updateRule,
  deleteRule,
} from '@/services/rule.service'

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
    const rule = await getRuleById(sessionUser.tenantId, id)

    return Response.json(rule)
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

    const { name, conditions, actions, priority } = body as Record<
      string,
      unknown
    >

    // Require at least one updatable field.
    if (
      name === undefined &&
      conditions === undefined &&
      actions === undefined &&
      priority === undefined
    ) {
      throw new ValidationError(
        'name, conditions, actions, priority 중 하나 이상 필요합니다.'
      )
    }

    // Validate each provided field.
    if (
      name !== undefined &&
      (typeof name !== 'string' || !name.trim())
    ) {
      throw new ValidationError('name은 비어 있을 수 없습니다.')
    }

    if (conditions !== undefined) {
      if (!Array.isArray(conditions) || conditions.length === 0) {
        throw new ValidationError(
          'conditions는 하나 이상의 조건을 포함하는 배열이어야 합니다.'
        )
      }

      const validConditionTypes = ['keyword', 'priority']
      for (const condition of conditions) {
        if (
          typeof condition !== 'object' ||
          condition === null ||
          typeof condition.type !== 'string' ||
          !validConditionTypes.includes(condition.type) ||
          typeof condition.value !== 'string' ||
          !condition.value.trim()
        ) {
          throw new ValidationError(
            'conditions의 각 항목은 { type: "keyword" | "priority", value: string } 형태여야 합니다.'
          )
        }
      }
    }

    if (actions !== undefined) {
      if (!Array.isArray(actions) || actions.length === 0) {
        throw new ValidationError(
          'actions는 하나 이상의 액션을 포함하는 배열이어야 합니다.'
        )
      }

      const validActionTypes = ['assign_agent', 'change_status']
      for (const action of actions) {
        if (
          typeof action !== 'object' ||
          action === null ||
          typeof action.type !== 'string' ||
          !validActionTypes.includes(action.type) ||
          typeof action.value !== 'string' ||
          !action.value.trim()
        ) {
          throw new ValidationError(
            'actions의 각 항목은 { type: "assign_agent" | "change_status", value: string } 형태여야 합니다.'
          )
        }
      }
    }

    if (
      priority !== undefined &&
      (typeof priority !== 'number' || !Number.isInteger(priority))
    ) {
      throw new ValidationError('priority는 정수여야 합니다.')
    }

    const { id } = await context.params

    const updated = await updateRule(sessionUser.tenantId, id, {
      name: typeof name === 'string' ? name.trim() : undefined,
      conditions: conditions as
        | { type: 'keyword' | 'priority'; value: string }[]
        | undefined,
      actions: actions as
        | { type: 'assign_agent' | 'change_status'; value: string }[]
        | undefined,
      priority: typeof priority === 'number' ? priority : undefined,
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
    await deleteRule(sessionUser.tenantId, id)

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
