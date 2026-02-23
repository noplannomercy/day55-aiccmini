/**
 * Audit middleware — convenience wrappers that build structured audit log
 * entries for common domain actions.  Each helper calls `logAction` from the
 * audit service internally, keeping the calling code concise while ensuring
 * consistent action names and entity types across the codebase.
 *
 * All helpers are async and non-blocking: `logAction` already swallows errors
 * internally, so callers do not need additional error handling.
 */

import { logAction } from '@/services/audit.service'

// ---------------------------------------------------------------------------
// Ticket audit helpers
// ---------------------------------------------------------------------------

export async function auditTicketCreate(
  tenantId: string,
  userId: string,
  ticketId: string,
  ticketData: Record<string, unknown>
): Promise<void> {
  await logAction(tenantId, userId, 'ticket.create', 'ticket', ticketId, null, ticketData)
}

export async function auditTicketUpdate(
  tenantId: string,
  userId: string,
  ticketId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Promise<void> {
  await logAction(tenantId, userId, 'ticket.update', 'ticket', ticketId, before, after)
}

export async function auditTicketStatusChange(
  tenantId: string,
  userId: string,
  ticketId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await logAction(
    tenantId,
    userId,
    'ticket.status_change',
    'ticket',
    ticketId,
    { status: oldStatus },
    { status: newStatus }
  )
}

export async function auditTicketAssign(
  tenantId: string,
  userId: string,
  ticketId: string,
  assigneeId: string
): Promise<void> {
  await logAction(
    tenantId,
    userId,
    'ticket.assign',
    'ticket',
    ticketId,
    null,
    { assigneeId }
  )
}

// ---------------------------------------------------------------------------
// Knowledge Base audit helpers
// ---------------------------------------------------------------------------

export async function auditKbCreate(
  tenantId: string,
  userId: string,
  articleId: string,
  articleData: Record<string, unknown>
): Promise<void> {
  await logAction(tenantId, userId, 'kb.create', 'kb_article', articleId, null, articleData)
}

export async function auditKbUpdate(
  tenantId: string,
  userId: string,
  articleId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Promise<void> {
  await logAction(tenantId, userId, 'kb.update', 'kb_article', articleId, before, after)
}

export async function auditKbDelete(
  tenantId: string,
  userId: string,
  articleId: string,
  articleData: Record<string, unknown>
): Promise<void> {
  await logAction(tenantId, userId, 'kb.delete', 'kb_article', articleId, articleData, null)
}

// ---------------------------------------------------------------------------
// Auto-rule audit helpers
// ---------------------------------------------------------------------------

export async function auditRuleCreate(
  tenantId: string,
  userId: string,
  ruleId: string,
  ruleData: Record<string, unknown>
): Promise<void> {
  await logAction(tenantId, userId, 'rule.create', 'auto_rule', ruleId, null, ruleData)
}

export async function auditRuleUpdate(
  tenantId: string,
  userId: string,
  ruleId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Promise<void> {
  await logAction(tenantId, userId, 'rule.update', 'auto_rule', ruleId, before, after)
}

export async function auditRuleDelete(
  tenantId: string,
  userId: string,
  ruleId: string,
  ruleData: Record<string, unknown>
): Promise<void> {
  await logAction(tenantId, userId, 'rule.delete', 'auto_rule', ruleId, ruleData, null)
}

export async function auditRuleToggle(
  tenantId: string,
  userId: string,
  ruleId: string,
  oldActive: boolean,
  newActive: boolean
): Promise<void> {
  await logAction(
    tenantId,
    userId,
    'rule.toggle',
    'auto_rule',
    ruleId,
    { isActive: oldActive },
    { isActive: newActive }
  )
}

// ---------------------------------------------------------------------------
// User audit helpers
// ---------------------------------------------------------------------------

export async function auditUserRoleChange(
  tenantId: string,
  userId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await logAction(
    tenantId,
    userId,
    'user.role_change',
    'user',
    targetUserId,
    { role: oldRole },
    { role: newRole }
  )
}
