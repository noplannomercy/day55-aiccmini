/**
 * Ticket service — the only place in the codebase that may directly query the
 * `tickets` table.  Every function accepts `tenantId` as its first argument so
 * that multi-tenant row isolation is enforced at the service boundary.
 *
 * Read operations (list / getById) join the `assignee`, `customer`, and
 * `createdBy` relations using leftJoin so that the caller receives a fully
 * hydrated `TicketWithRelations` object without needing additional queries.
 *
 * Keyword search uses SQL ILIKE for case-insensitive matching against both
 * the ticket title and description.
 */

import { eq, and, or, ilike, sql, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tickets, users, customers } from '@/lib/db/schema'
import { NotFoundError, AppError } from '@/lib/errors'
import { applyRules } from './rule.service'
import { getPaginationOffset, getTotalPages } from '@/lib/utils'
import { createNotification } from './notification.service'
import {
  auditTicketCreate,
  auditTicketUpdate,
  auditTicketStatusChange,
  auditTicketAssign,
} from '@/lib/audit.middleware'
import type {
  Ticket,
  TicketWithRelations,
  TicketStatus,
  TicketPriority,
  PaginatedResult,
} from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TicketFilters = {
  status?: TicketStatus
  priority?: TicketPriority
  assigneeId?: string
  keyword?: string
}

type CreateTicketData = {
  title: string
  description: string
  priority?: TicketPriority
  customerId?: string
}

type UpdateTicketData = {
  title?: string
  description?: string
  priority?: TicketPriority
  customerId?: string | null
}

// ---------------------------------------------------------------------------
// Alias tables for the two user joins (assignee vs. createdBy)
// ---------------------------------------------------------------------------

const assigneeAlias = db
  .select({
    id: users.id,
    tenantId: users.tenantId,
    email: users.email,
    name: users.name,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  })
  .from(users)
  .as('assignee')

const createdByAlias = db
  .select({
    id: users.id,
    tenantId: users.tenantId,
    email: users.email,
    name: users.name,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  })
  .from(users)
  .as('created_by')

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of tickets for the given tenant with optional
 * filters.  Results are ordered by creation date descending (newest first)
 * so the most recent tickets appear at the top of the list.
 *
 * Keyword search is performed via SQL ILIKE against both title and description,
 * ensuring case-insensitive matching without requiring a full-text search index.
 */
export async function listTickets(
  tenantId: string,
  filters: TicketFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResult<TicketWithRelations>> {
  const conditions = [eq(tickets.tenantId, tenantId)]

  if (filters.status) {
    conditions.push(eq(tickets.status, filters.status))
  }
  if (filters.priority) {
    conditions.push(eq(tickets.priority, filters.priority))
  }
  if (filters.assigneeId) {
    conditions.push(eq(tickets.assigneeId, filters.assigneeId))
  }
  if (filters.keyword) {
    const pattern = `%${filters.keyword}%`
    conditions.push(
      or(
        ilike(tickets.title, pattern),
        ilike(tickets.description, pattern)
      )!
    )
  }

  const whereClause = and(...conditions)

  // Count total matching rows for pagination metadata.
  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(tickets)
    .where(whereClause)

  const total = countResult?.count ?? 0
  const offset = getPaginationOffset(page, limit)

  // Fetch the page of tickets with joined relations.
  const rows = await db
    .select({
      ticket: tickets,
      assignee: {
        id: assigneeAlias.id,
        tenantId: assigneeAlias.tenantId,
        email: assigneeAlias.email,
        name: assigneeAlias.name,
        role: assigneeAlias.role,
        isActive: assigneeAlias.isActive,
        createdAt: assigneeAlias.createdAt,
      },
      customer: {
        id: customers.id,
        tenantId: customers.tenantId,
        email: customers.email,
        name: customers.name,
        phone: customers.phone,
        createdAt: customers.createdAt,
      },
      createdBy: {
        id: createdByAlias.id,
        tenantId: createdByAlias.tenantId,
        email: createdByAlias.email,
        name: createdByAlias.name,
        role: createdByAlias.role,
        isActive: createdByAlias.isActive,
        createdAt: createdByAlias.createdAt,
      },
    })
    .from(tickets)
    .leftJoin(assigneeAlias, eq(tickets.assigneeId, assigneeAlias.id))
    .leftJoin(customers, eq(tickets.customerId, customers.id))
    .leftJoin(createdByAlias, eq(tickets.createdById, createdByAlias.id))
    .where(whereClause)
    .orderBy(desc(tickets.createdAt))
    .limit(limit)
    .offset(offset)

  const data: TicketWithRelations[] = rows.map((row) => ({
    ...row.ticket,
    assignee: row.assignee?.id ? row.assignee : null,
    customer: row.customer?.id ? row.customer : null,
    createdBy: row.createdBy?.id ? row.createdBy : null,
  }))

  return {
    data,
    total,
    page,
    limit,
    totalPages: getTotalPages(total, limit),
  }
}

/**
 * Fetches a single ticket by ID, guaranteeing it belongs to `tenantId` to
 * prevent cross-tenant data leakage.  Joins assignee, customer, and createdBy.
 *
 * @throws {NotFoundError} when no matching record exists within the tenant.
 */
export async function getTicketById(
  tenantId: string,
  ticketId: string
): Promise<TicketWithRelations> {
  const rows = await db
    .select({
      ticket: tickets,
      assignee: {
        id: assigneeAlias.id,
        tenantId: assigneeAlias.tenantId,
        email: assigneeAlias.email,
        name: assigneeAlias.name,
        role: assigneeAlias.role,
        isActive: assigneeAlias.isActive,
        createdAt: assigneeAlias.createdAt,
      },
      customer: {
        id: customers.id,
        tenantId: customers.tenantId,
        email: customers.email,
        name: customers.name,
        phone: customers.phone,
        createdAt: customers.createdAt,
      },
      createdBy: {
        id: createdByAlias.id,
        tenantId: createdByAlias.tenantId,
        email: createdByAlias.email,
        name: createdByAlias.name,
        role: createdByAlias.role,
        isActive: createdByAlias.isActive,
        createdAt: createdByAlias.createdAt,
      },
    })
    .from(tickets)
    .leftJoin(assigneeAlias, eq(tickets.assigneeId, assigneeAlias.id))
    .leftJoin(customers, eq(tickets.customerId, customers.id))
    .leftJoin(createdByAlias, eq(tickets.createdById, createdByAlias.id))
    .where(and(eq(tickets.id, ticketId), eq(tickets.tenantId, tenantId)))
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw new NotFoundError('티켓')
  }

  return {
    ...row.ticket,
    assignee: row.assignee?.id ? row.assignee : null,
    customer: row.customer?.id ? row.customer : null,
    createdBy: row.createdBy?.id ? row.createdBy : null,
  }
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Creates a new ticket within the given tenant.  The `createdById` is set to
 * the session user who initiated the request.  Status defaults to 'open' and
 * priority defaults to 'medium' (as defined in the schema) unless overridden.
 */
export async function createTicket(
  tenantId: string,
  data: CreateTicketData,
  createdById: string
): Promise<Ticket> {
  const [ticket] = await db
    .insert(tickets)
    .values({
      tenantId,
      title: data.title,
      description: data.description,
      priority: data.priority ?? 'medium',
      customerId: data.customerId ?? null,
      createdById,
    })
    .returning()

  if (!ticket) {
    throw new AppError('티켓 생성에 실패했습니다.')
  }

  // Apply automation rules (non-blocking — rule failures don't affect ticket creation)
  try {
    await applyRules(tenantId, ticket)
  } catch (e) {
    // Rule execution errors are non-fatal
    console.error('Rule execution failed:', e)
  }

  // Non-blocking side effects: audit log + notification for assignee
  Promise.allSettled([
    auditTicketCreate(tenantId, createdById, ticket.id, {
      title: ticket.title,
      priority: ticket.priority,
    }).catch(() => {}),
    ...(ticket.assigneeId
      ? [
          createNotification(
            tenantId,
            ticket.assigneeId,
            'ticket_assigned',
            '새 티켓 배정',
            `티켓 "${ticket.title}"이(가) 배정되었습니다.`,
            ticket.id,
            'ticket'
          ).catch(() => {}),
        ]
      : []),
  ]).catch(() => {})

  return ticket
}

/**
 * Updates mutable fields of an existing ticket (title, description, priority,
 * customerId).  Only the provided fields are modified; omitted fields remain
 * unchanged.
 *
 * @throws {NotFoundError} when the ticket does not exist in this tenant.
 */
export async function updateTicket(
  tenantId: string,
  ticketId: string,
  data: UpdateTicketData
): Promise<Ticket> {
  // Confirm the record exists and belongs to this tenant before updating.
  await getTicketById(tenantId, ticketId)

  const setData: Record<string, unknown> = { updatedAt: new Date() }

  if (data.title !== undefined) setData.title = data.title
  if (data.description !== undefined) setData.description = data.description
  if (data.priority !== undefined) setData.priority = data.priority
  if (data.customerId !== undefined) setData.customerId = data.customerId

  const [updated] = await db
    .update(tickets)
    .set(setData)
    .where(and(eq(tickets.id, ticketId), eq(tickets.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw new AppError('티켓 수정에 실패했습니다.')
  }

  // Non-blocking side effect: audit log
  auditTicketUpdate(tenantId, updated.createdById ?? '', ticketId, {}, data).catch(() => {})

  return updated
}

/**
 * Transitions the ticket to a new status value.
 *
 * @throws {NotFoundError} when the ticket does not exist in this tenant.
 */
export async function changeTicketStatus(
  tenantId: string,
  ticketId: string,
  status: TicketStatus
): Promise<Ticket> {
  const existing = await getTicketById(tenantId, ticketId)

  const [updated] = await db
    .update(tickets)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(tickets.id, ticketId), eq(tickets.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw new AppError('티켓 상태 변경에 실패했습니다.')
  }

  // Non-blocking side effects: audit log + notifications
  const notifyTargets: string[] = []
  if (existing.createdById) notifyTargets.push(existing.createdById)
  if (existing.assigneeId && existing.assigneeId !== existing.createdById) {
    notifyTargets.push(existing.assigneeId)
  }

  Promise.allSettled([
    auditTicketStatusChange(
      tenantId,
      existing.createdById ?? '',
      ticketId,
      existing.status,
      status
    ).catch(() => {}),
    ...notifyTargets.map((userId) =>
      createNotification(
        tenantId,
        userId,
        'status_changed',
        '티켓 상태 변경',
        `티켓 "${existing.title}" 상태가 "${existing.status}"에서 "${status}"(으)로 변경되었습니다.`,
        ticketId,
        'ticket'
      ).catch(() => {})
    ),
  ]).catch(() => {})

  return updated
}

/**
 * Assigns a ticket to a user.  The target assignee must exist within the same
 * tenant to prevent cross-tenant assignment.
 *
 * @throws {NotFoundError} when the ticket or assignee does not exist in this tenant.
 */
export async function assignTicket(
  tenantId: string,
  ticketId: string,
  assigneeId: string
): Promise<Ticket> {
  const existing = await getTicketById(tenantId, ticketId)

  // Verify the assignee exists within the same tenant.
  const [assignee] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, assigneeId), eq(users.tenantId, tenantId)))
    .limit(1)

  if (!assignee) {
    throw new NotFoundError('담당자')
  }

  const [updated] = await db
    .update(tickets)
    .set({ assigneeId, updatedAt: new Date() })
    .where(and(eq(tickets.id, ticketId), eq(tickets.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw new AppError('티켓 담당자 배정에 실패했습니다.')
  }

  // Non-blocking side effects: audit log + notification for new assignee
  Promise.allSettled([
    auditTicketAssign(tenantId, existing.createdById ?? '', ticketId, assigneeId).catch(() => {}),
    createNotification(
      tenantId,
      assigneeId,
      'ticket_assigned',
      '티켓 배정',
      `티켓 "${existing.title}"이(가) 배정되었습니다.`,
      ticketId,
      'ticket'
    ).catch(() => {}),
  ]).catch(() => {})

  return updated
}

/**
 * Permanently removes a ticket from the database.
 *
 * @throws {NotFoundError} when the ticket does not exist in this tenant.
 */
export async function deleteTicket(
  tenantId: string,
  ticketId: string
): Promise<void> {
  await getTicketById(tenantId, ticketId)

  const deleted = await db
    .delete(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.tenantId, tenantId)))
    .returning({ id: tickets.id })

  if (!deleted.length) {
    throw new AppError('티켓 삭제에 실패했습니다.')
  }
}
