import type { InferSelectModel } from 'drizzle-orm'
import type {
  tenants,
  users,
  customers,
  tickets,
  ticketComments,
  kbArticles,
  autoRules,
  auditLogs,
  notifications,
} from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Base types inferred from Drizzle schema
// ---------------------------------------------------------------------------

export type Tenant = InferSelectModel<typeof tenants>
export type User = InferSelectModel<typeof users>
export type Customer = InferSelectModel<typeof customers>
export type Ticket = InferSelectModel<typeof tickets>
export type TicketComment = InferSelectModel<typeof ticketComments>
export type KBArticle = InferSelectModel<typeof kbArticles>
export type AutoRule = InferSelectModel<typeof autoRules>
export type AuditLog = InferSelectModel<typeof auditLogs>
export type Notification = InferSelectModel<typeof notifications>

// ---------------------------------------------------------------------------
// Enum literal types (mirrors the pgEnum definitions)
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'agent' | 'viewer'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

// ---------------------------------------------------------------------------
// Extended types (with eagerly loaded relations)
// ---------------------------------------------------------------------------

export type TicketWithRelations = Ticket & {
  assignee?: User | null
  customer?: Customer | null
  createdBy?: User | null
  comments?: TicketComment[]
}

// ---------------------------------------------------------------------------
// Rule engine condition / action shapes
// ---------------------------------------------------------------------------

export type RuleCondition = {
  keywords?: string[]
  priority?: TicketPriority
}

export type RuleAction = {
  assignTo?: string
  setStatus?: TicketStatus
}

// ---------------------------------------------------------------------------
// Pagination utilities
// ---------------------------------------------------------------------------

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Session user (derived from Supabase Auth + DB lookup)
// ---------------------------------------------------------------------------

export type SessionUser = {
  id: string
  email: string
  name: string
  role: UserRole
  tenantId: string
}
