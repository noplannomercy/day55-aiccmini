/**
 * /api/kb — KB article collection-level resource handler.
 *
 * GET  — returns a paginated list of KB articles for the session user's tenant.
 *         Supports optional query params: keyword, page, limit.
 *         Requires authentication.
 *
 * POST — creates a new KB article inside the tenant.
 *         Restricted to admin or agent roles.
 *         Body: { title: string, content: string, tags?: string[] }
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/errors'
import { listArticles, createArticle } from '@/services/kb.service'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    const { searchParams } = request.nextUrl

    const keyword = searchParams.get('keyword') || undefined

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20)
    )

    const result = await listArticles(
      sessionUser.tenantId,
      keyword,
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

    // Only admin and agent roles may create KB articles.
    if (sessionUser.role === 'viewer') {
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

    const { title, content, tags } = body as Record<string, unknown>

    // Validate required fields.
    if (typeof title !== 'string' || !title.trim()) {
      throw new ValidationError('title 필드가 필요합니다.')
    }

    if (typeof content !== 'string' || !content.trim()) {
      throw new ValidationError('content 필드가 필요합니다.')
    }

    // Validate optional tags field.
    if (tags !== undefined) {
      if (
        !Array.isArray(tags) ||
        !tags.every((t) => typeof t === 'string')
      ) {
        throw new ValidationError('tags는 문자열 배열이어야 합니다.')
      }
    }

    const article = await createArticle(
      sessionUser.tenantId,
      {
        title: title.trim(),
        content: content.trim(),
        tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()) : undefined,
      },
      sessionUser.id
    )

    return Response.json(article, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
