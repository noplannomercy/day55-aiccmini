import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { getTicketById } from '@/services/ticket.service'
import { listUsers } from '@/services/user.service'
import { listComments } from '@/services/comment.service'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { CommentList } from '@/components/tickets/CommentList'
import { CommentForm } from '@/components/tickets/CommentForm'
import { AttachmentMeta } from '@/components/tickets/AttachmentMeta'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { NotFoundError } from '@/lib/errors'
import { TicketStatusActions } from './TicketStatusActions'
import { TicketAssignActions } from './TicketAssignActions'

interface TicketDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * /tickets/[id] -- ticket detail page.
 *
 * Displays full ticket details with status and assignee management sections.
 * Interactive controls (status change, assignment) are extracted into client
 * components that call the corresponding API endpoints.
 */
export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  let ticket
  try {
    ticket = await getTicketById(session.tenantId, id)
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound()
    }
    throw err
  }

  const [users, comments] = await Promise.all([
    listUsers(session.tenantId),
    listComments(session.tenantId, id),
  ])

  const canManage = session.role === 'admin' || session.role === 'agent'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link href="/tickets">
        <Button variant="ghost" size="sm">
          &larr; Back to Tickets
        </Button>
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-2xl font-bold text-gray-900">
            {ticket.title}
          </h1>
          <TicketStatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border p-4">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Description</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {ticket.description}
        </p>
      </div>

      {/* Metadata */}
      <div className="grid gap-4 sm:grid-cols-2">
        <MetadataItem label="Assignee" value={ticket.assignee?.name ?? 'Unassigned'} />
        <MetadataItem label="Customer" value={ticket.customer?.name ?? '-'} />
        <MetadataItem label="Created By" value={ticket.createdBy?.name ?? '-'} />
        <MetadataItem
          label="Created At"
          value={ticket.createdAt ? formatDateTime(ticket.createdAt) : '-'}
        />
        <MetadataItem
          label="Updated At"
          value={ticket.updatedAt ? formatDateTime(ticket.updatedAt) : '-'}
        />
      </div>

      {/* Actions */}
      {canManage && (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Actions</h2>

          <div className="space-y-3">
            <TicketStatusActions ticketId={ticket.id} currentStatus={ticket.status} />
            <TicketAssignActions
              ticketId={ticket.id}
              currentAssigneeId={ticket.assigneeId}
              users={users}
            />
          </div>
        </div>
      )}

      {/* Attachments */}
      <AttachmentMeta attachments={ticket.attachments as unknown[] | null} />

      {/* Comments */}
      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Comments</h2>
        <CommentList comments={comments} currentUserRole={session.role} />
        <CommentForm ticketId={ticket.id} userRole={session.role} />
      </div>
    </div>
  )
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  )
}
