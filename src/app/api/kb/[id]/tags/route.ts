/**
 * /api/kb/[id]/tags — tag management for a single KB article.
 *
 * POST   — appends a tag to the article's tags array.
 *           Restricted to admin or agent roles.
 *           Body: { tag: string }
 *
 * DELETE — removes a tag from the article's tags array.
 *           Restricted to admin or agent roles.
 *           Body: { tag: string }
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/errors'
import { addTag, removeTag } from '@/services/kb.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    // Only admin and agent roles may manage tags.
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

    const { tag } = body as Record<string, unknown>

    if (typeof tag !== 'string' || !tag.trim()) {
      throw new ValidationError('tag 필드가 필요합니다.')
    }

    const { id } = await context.params
    const updated = await addTag(sessionUser.tenantId, id, tag.trim())

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    // Only admin and agent roles may manage tags.
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

    const { tag } = body as Record<string, unknown>

    if (typeof tag !== 'string' || !tag.trim()) {
      throw new ValidationError('tag 필드가 필요합니다.')
    }

    const { id } = await context.params
    const updated = await removeTag(sessionUser.tenantId, id, tag.trim())

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
