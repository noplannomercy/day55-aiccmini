/**
 * Rule service — manages automation rules and executes them against tickets.
 *
 * Every function accepts `tenantId` as its first argument to enforce
 * multi-tenant row isolation at the service boundary.
 *
 * IMPORTANT: This module uses `db` directly for ticket updates inside
 * `applyRules` instead of importing from `ticket.service.ts` to avoid
 * circular dependencies.
 */

import { eq, and, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { autoRules, tickets } from '@/lib/db/schema'
import { NotFoundError, AppError } from '@/lib/errors'
import {
  auditRuleCreate,
  auditRuleUpdate,
  auditRuleDelete,
  auditRuleToggle,
} from '@/lib/audit.middleware'
import type { AutoRule, Ticket } from '@/types'

// ---------------------------------------------------------------------------
// Condition / Action shapes stored in the jsonb columns
// ---------------------------------------------------------------------------

type RuleConditionEntry = {
  type: 'keyword' | 'priority'
  value: string
}

type RuleActionEntry = {
  type: 'assign_agent' | 'change_status'
  value: string
}

type CreateRuleData = {
  name: string
  conditions: RuleConditionEntry[]
  actions: RuleActionEntry[]
  priority?: number
}

type UpdateRuleData = {
  name?: string
  conditions?: RuleConditionEntry[]
  actions?: RuleActionEntry[]
  priority?: number
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * Returns all automation rules for the tenant, ordered by priority ascending
 * (lower number = higher priority).
 */
export async function listRules(tenantId: string): Promise<AutoRule[]> {
  return db
    .select()
    .from(autoRules)
    .where(eq(autoRules.tenantId, tenantId))
    .orderBy(asc(autoRules.priority))
}

/**
 * Fetches a single rule by ID, verifying it belongs to the given tenant.
 *
 * @throws {NotFoundError} when the rule does not exist within the tenant.
 */
export async function getRuleById(
  tenantId: string,
  ruleId: string
): Promise<AutoRule> {
  const [rule] = await db
    .select()
    .from(autoRules)
    .where(and(eq(autoRules.id, ruleId), eq(autoRules.tenantId, tenantId)))
    .limit(1)

  if (!rule) {
    throw new NotFoundError('자동화 룰')
  }

  return rule
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Creates a new automation rule within the tenant.
 * Priority defaults to 0 (highest) if not specified.
 */
export async function createRule(
  tenantId: string,
  data: CreateRuleData,
  createdById: string
): Promise<AutoRule> {
  const [rule] = await db
    .insert(autoRules)
    .values({
      tenantId,
      name: data.name,
      conditions: data.conditions,
      actions: data.actions,
      priority: data.priority ?? 0,
      createdById,
    })
    .returning()

  if (!rule) {
    throw new AppError('자동화 룰 생성에 실패했습니다.')
  }

  // Non-blocking side effect: audit log
  auditRuleCreate(tenantId, createdById, rule.id, { name: rule.name }).catch(() => {})

  return rule
}

/**
 * Updates mutable fields of an existing rule.
 * Only the provided fields are modified; omitted fields remain unchanged.
 *
 * @throws {NotFoundError} when the rule does not exist in this tenant.
 */
export async function updateRule(
  tenantId: string,
  ruleId: string,
  data: UpdateRuleData
): Promise<AutoRule> {
  const existing = await getRuleById(tenantId, ruleId)

  const setData: Record<string, unknown> = {}

  if (data.name !== undefined) setData.name = data.name
  if (data.conditions !== undefined) setData.conditions = data.conditions
  if (data.actions !== undefined) setData.actions = data.actions
  if (data.priority !== undefined) setData.priority = data.priority

  const [updated] = await db
    .update(autoRules)
    .set(setData)
    .where(and(eq(autoRules.id, ruleId), eq(autoRules.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw new AppError('자동화 룰 수정에 실패했습니다.')
  }

  // Non-blocking side effect: audit log
  auditRuleUpdate(
    tenantId,
    existing.createdById ?? '',
    ruleId,
    { name: existing.name },
    data
  ).catch(() => {})

  return updated
}

/**
 * Permanently removes a rule from the database.
 *
 * @throws {NotFoundError} when the rule does not exist in this tenant.
 */
export async function deleteRule(
  tenantId: string,
  ruleId: string
): Promise<void> {
  const existing = await getRuleById(tenantId, ruleId)

  const deleted = await db
    .delete(autoRules)
    .where(and(eq(autoRules.id, ruleId), eq(autoRules.tenantId, tenantId)))
    .returning({ id: autoRules.id })

  if (!deleted.length) {
    throw new AppError('자동화 룰 삭제에 실패했습니다.')
  }

  // Non-blocking side effect: audit log
  auditRuleDelete(tenantId, existing.createdById ?? '', ruleId, {
    name: existing.name,
  }).catch(() => {})
}

/**
 * Toggles the `isActive` flag on a rule.
 *
 * @throws {NotFoundError} when the rule does not exist in this tenant.
 */
export async function toggleRule(
  tenantId: string,
  ruleId: string
): Promise<AutoRule> {
  const existing = await getRuleById(tenantId, ruleId)

  const [updated] = await db
    .update(autoRules)
    .set({ isActive: !existing.isActive })
    .where(and(eq(autoRules.id, ruleId), eq(autoRules.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw new AppError('자동화 룰 토글에 실패했습니다.')
  }

  // Non-blocking side effect: audit log
  auditRuleToggle(
    tenantId,
    existing.createdById ?? '',
    ruleId,
    existing.isActive ?? false,
    !(existing.isActive ?? false)
  ).catch(() => {})

  return updated
}

// ---------------------------------------------------------------------------
// Rule engine
// ---------------------------------------------------------------------------

/**
 * Evaluates all active rules for the tenant against the given ticket.
 *
 * Processing order:
 * 1. Fetch all active rules ordered by priority ASC (lower = higher priority).
 * 2. For each rule, check ALL conditions using AND logic:
 *    - `keyword`: ticket title or description contains the value (case-insensitive)
 *    - `priority`: ticket priority exactly equals the value
 * 3. If all conditions match, execute ALL actions:
 *    - `assign_agent`: set the ticket's assignee_id
 *    - `change_status`: set the ticket's status
 *
 * Uses `db` directly for ticket updates to avoid circular dependency
 * with ticket.service.ts.
 */
export async function applyRules(
  tenantId: string,
  ticket: Ticket
): Promise<void> {
  const activeRules = await db
    .select()
    .from(autoRules)
    .where(and(eq(autoRules.tenantId, tenantId), eq(autoRules.isActive, true)))
    .orderBy(asc(autoRules.priority))

  for (const rule of activeRules) {
    const conditions = rule.conditions as RuleConditionEntry[]

    if (!Array.isArray(conditions) || conditions.length === 0) {
      continue
    }

    const allMatch = conditions.every((condition) => {
      switch (condition.type) {
        case 'keyword': {
          const keyword = condition.value.toLowerCase()
          const title = (ticket.title ?? '').toLowerCase()
          const description = (ticket.description ?? '').toLowerCase()
          return title.includes(keyword) || description.includes(keyword)
        }
        case 'priority':
          return ticket.priority === condition.value
        default:
          return false
      }
    })

    if (!allMatch) {
      continue
    }

    const actions = rule.actions as RuleActionEntry[]

    if (!Array.isArray(actions)) {
      continue
    }

    for (const action of actions) {
      switch (action.type) {
        case 'assign_agent':
          await db
            .update(tickets)
            .set({ assigneeId: action.value, updatedAt: new Date() })
            .where(
              and(eq(tickets.id, ticket.id), eq(tickets.tenantId, tenantId))
            )
          break
        case 'change_status':
          await db
            .update(tickets)
            .set({
              status: action.value as Ticket['status'],
              updatedAt: new Date(),
            })
            .where(
              and(eq(tickets.id, ticket.id), eq(tickets.tenantId, tenantId))
            )
          break
      }
    }
  }
}
