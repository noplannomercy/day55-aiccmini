/**
 * Notification service — the only place in the codebase that may directly
 * query the `notifications` table.  Every function accepts `tenantId` as its
 * first argument so that multi-tenant row isolation is enforced at the service
 * boundary.
 *
 * Notifications are scoped to both tenant_id AND user_id to ensure users can
 * only access their own notifications within their tenant.
 */

import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { NotFoundError, ForbiddenError, AppError } from '@/lib/errors'
import { getPaginationOffset, getTotalPages } from '@/lib/utils'
import type { Notification, PaginatedResult } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationType = 'ticket_assigned' | 'status_changed' | 'comment_added'

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Creates a new notification for a specific user within the tenant.
 *
 * @param tenantId - Tenant scope for multi-tenant isolation
 * @param userId - Target user who will receive the notification
 * @param type - Notification category (ticket_assigned, status_changed, comment_added)
 * @param title - Short summary of the notification
 * @param message - Detailed notification message
 * @param relatedEntityId - Optional ID of the related entity (e.g. ticket ID)
 * @param relatedEntityType - Optional entity type (e.g. 'ticket', 'comment')
 */
export async function createNotification(
  tenantId: string,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedEntityId?: string,
  relatedEntityType?: string
): Promise<Notification> {
  const [notification] = await db
    .insert(notifications)
    .values({
      tenantId,
      userId,
      type,
      title,
      message,
      relatedEntityId: relatedEntityId ?? null,
      relatedEntityType: relatedEntityType ?? null,
    })
    .returning()

  if (!notification) {
    throw new AppError('알림 생성에 실패했습니다.')
  }

  return notification
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of notifications for a specific user within the
 * tenant.  Results are ordered by creation date descending (newest first).
 */
export async function listNotifications(
  tenantId: string,
  userId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResult<Notification>> {
  const whereClause = and(
    eq(notifications.tenantId, tenantId),
    eq(notifications.userId, userId)
  )

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(notifications)
    .where(whereClause)

  const total = countResult?.count ?? 0
  const offset = getPaginationOffset(page, limit)

  const data = await db
    .select()
    .from(notifications)
    .where(whereClause)
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset)

  return {
    data,
    total,
    page,
    limit,
    totalPages: getTotalPages(total, limit),
  }
}

/**
 * Returns the number of unread notifications for a specific user within the
 * tenant.  Used for badge counts in the UI header.
 */
export async function getUnreadCount(
  tenantId: string,
  userId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    )

  return result?.count ?? 0
}

// ---------------------------------------------------------------------------
// Update operations
// ---------------------------------------------------------------------------

/**
 * Marks a single notification as read.  The notification must belong to the
 * requesting user within the tenant — attempting to mark another user's
 * notification throws a ForbiddenError.
 *
 * @throws {NotFoundError} when the notification does not exist in this tenant.
 * @throws {ForbiddenError} when the notification belongs to a different user.
 */
export async function markAsRead(
  tenantId: string,
  notificationId: string,
  userId: string
): Promise<Notification> {
  // Fetch the notification scoped to the tenant.
  const [existing] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.tenantId, tenantId)
      )
    )
    .limit(1)

  if (!existing) {
    throw new NotFoundError('알림')
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError('다른 사용자의 알림을 수정할 수 없습니다.')
  }

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId)
      )
    )
    .returning()

  if (!updated) {
    throw new AppError('알림 읽음 처리에 실패했습니다.')
  }

  return updated
}

/**
 * Marks all unread notifications as read for a specific user within the tenant.
 * This is a bulk operation typically triggered by the "mark all as read" UI action.
 */
export async function markAllAsRead(
  tenantId: string,
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    )
}
