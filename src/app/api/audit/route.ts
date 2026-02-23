/**
 * /api/audit — audit log collection resource handler.
 *
 * GET — returns a paginated list of audit logs for the session user's tenant.
 *       Restricted to admin users only.
 *       Supports optional query params: userId, action, dateFrom, dateTo,
 *       page, limit.
 */

import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/errors'
import { listAuditLogs } from '@/services/audit.service'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      throw new UnauthorizedError()
    }

    if (sessionUser.role !== 'admin') {
      throw new ForbiddenError('감사로그 조회는 관리자만 가능합니다.')
    }

    const { searchParams } = request.nextUrl

    // Parse optional filter params.
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') || undefined

    // Parse and validate date range filters.
    const dateFromParam = searchParams.get('dateFrom')
    const dateToParam = searchParams.get('dateTo')

    let dateFrom: Date | undefined
    let dateTo: Date | undefined

    if (dateFromParam) {
      dateFrom = new Date(dateFromParam)
      if (isNaN(dateFrom.getTime())) {
        throw new ValidationError('dateFrom은 유효한 날짜 형식이어야 합니다.')
      }
    }

    if (dateToParam) {
      dateTo = new Date(dateToParam)
      if (isNaN(dateTo.getTime())) {
        throw new ValidationError('dateTo는 유효한 날짜 형식이어야 합니다.')
      }
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20)
    )

    const result = await listAuditLogs(
      sessionUser.tenantId,
      { userId, action, dateFrom, dateTo },
      page,
      limit
    )

    return Response.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
