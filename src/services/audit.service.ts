/**
 * Audit log service — the only place in the codebase that may directly query
 * the `audit_logs` table.  Every function accepts `tenantId` as its first
 * argument so that multi-tenant row isolation is enforced at the service
 * boundary.
 *
 * `logAction` is intentionally fire-and-forget: it swallows all errors so that
 * audit logging never disrupts the primary business operation.
 *
 * `listAuditLogs` returns a paginated result with the user name/email joined
 * for display purposes, ordered by creation date descending (newest first).
 */

import { eq, and, sql, desc, gte, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auditLogs, users } from '@/lib/db/schema'
import { getPaginationOffset, getTotalPages } from '@/lib/utils'
import type { AuditLog, PaginatedResult } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuditLogFilters = {
  userId?: string
  action?: string
  dateFrom?: Date
  dateTo?: Date
}

type AuditLogWithUser = AuditLog & {
  user: { name: string; email: string }
}

// ---------------------------------------------------------------------------
// Write operation
// ---------------------------------------------------------------------------

/**
 * Inserts a single audit log entry.  Errors are caught and logged to the
 * console so that the caller's primary operation is never disrupted.
 *
 * This function is intentionally non-blocking from the caller's perspective —
 * callers do not need to await the result.
 */
export async function logAction(
  tenantId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      tenantId,
      userId,
      action,
      entityType,
      entityId,
      before: before ?? null,
      after: after ?? null,
    })
  } catch (error) {
    // Non-fatal — audit logging must never break the primary operation.
    console.error('Audit log insert failed:', error)
  }
}

// ---------------------------------------------------------------------------
// Read operation
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of audit logs for the given tenant with optional
 * filters.  Joins the `users` table to include the acting user's name and
 * email.  Results are ordered by creation date descending (newest first).
 */
export async function listAuditLogs(
  tenantId: string,
  filters: AuditLogFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResult<AuditLogWithUser>> {
  const conditions = [eq(auditLogs.tenantId, tenantId)]

  if (filters.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId))
  }
  if (filters.action) {
    conditions.push(eq(auditLogs.action, filters.action))
  }
  if (filters.dateFrom) {
    conditions.push(gte(auditLogs.createdAt, filters.dateFrom))
  }
  if (filters.dateTo) {
    conditions.push(lte(auditLogs.createdAt, filters.dateTo))
  }

  const whereClause = and(...conditions)

  // Count total matching rows for pagination metadata.
  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(auditLogs)
    .where(whereClause)

  const total = countResult?.count ?? 0
  const offset = getPaginationOffset(page, limit)

  // Fetch the page of audit logs with joined user info.
  const rows = await db
    .select({
      auditLog: auditLogs,
      user: {
        name: users.name,
        email: users.email,
      },
    })
    .from(auditLogs)
    .innerJoin(users, eq(auditLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)

  const data: AuditLogWithUser[] = rows.map((row) => ({
    ...row.auditLog,
    user: row.user,
  }))

  return {
    data,
    total,
    page,
    limit,
    totalPages: getTotalPages(total, limit),
  }
}
