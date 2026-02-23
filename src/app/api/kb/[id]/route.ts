/**
 * /api/kb/[id] — individual KB article resource handler.
 *
 * GET    — returns a single KB article with author info.
 *           Requires authentication.
 *
 * PATCH  — updates a KB article's mutable fields (title, content, tags).
 *           Restricted to admin or agent roles.
 *           Automatically increments the version number.
 *           Body: { title?, content?, tags? }
 *
 * DELETE — permanently removes the KB article.
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
  getArticleById,
  updateArticle,
  deleteArticle,
} from '@/services/kb.service'

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
    const article = await getArticleById(sessionUser.tenantId, id)

    return Response.json(article)
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

    // Only admin and agent roles may update KB articles.
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

    const { title, content, tags } = body as Record<string, unknown>

    // Require at least one updatable field.
    if (
      title === undefined &&
      content === undefined &&
      tags === undefined
    ) {
      throw new ValidationError(
        'title, content, tags 중 하나 이상 필요합니다.'
      )
    }

    // Validate each provided field.
    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      throw new ValidationError('title은 비어 있을 수 없습니다.')
    }

    if (
      content !== undefined &&
      (typeof content !== 'string' || !content.trim())
    ) {
      throw new ValidationError('content는 비어 있을 수 없습니다.')
    }

    if (tags !== undefined) {
      if (
        !Array.isArray(tags) ||
        !tags.every((t) => typeof t === 'string')
      ) {
        throw new ValidationError('tags는 문자열 배열이어야 합니다.')
      }
    }

    const { id } = await context.params

    const updated = await updateArticle(sessionUser.tenantId, id, {
      title: typeof title === 'string' ? title.trim() : undefined,
      content: typeof content === 'string' ? content.trim() : undefined,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()) : undefined,
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
    await deleteArticle(sessionUser.tenantId, id)

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
