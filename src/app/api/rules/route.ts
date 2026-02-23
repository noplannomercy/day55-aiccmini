/**
 * /api/rules — collection-level resource handler for automation rules.
 *
 * GET  — returns all rules for the session user's tenant, ordered by priority.
 *         Any authenticated user may list rules.
 *
 * POST — creates a new automation rule.
 *         Restricted to admin role.
 *         Body: { name: string, conditions: array, actions: array, priority?: number }
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/errors'
import { listRules, createRule } from '@/services/rule.service'

export async function GET(): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    const rules = await listRules(sessionUser.tenantId)

    return Response.json(rules)
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

    // Validate required fields.
    if (typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('name 필드가 필요합니다.')
    }

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

    if (
      priority !== undefined &&
      (typeof priority !== 'number' || !Number.isInteger(priority))
    ) {
      throw new ValidationError('priority는 정수여야 합니다.')
    }

    const rule = await createRule(
      sessionUser.tenantId,
      {
        name: name.trim(),
        conditions,
        actions,
        priority: typeof priority === 'number' ? priority : undefined,
      },
      sessionUser.id
    )

    return Response.json(rule, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
