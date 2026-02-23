import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { CreateTicketForm } from '@/components/tickets/CreateTicketForm'

/**
 * /tickets/new — ticket creation page.
 *
 * Server Component that renders the CreateTicketForm client component.
 * Any authenticated user may create a ticket.
 */
export default async function NewTicketPage() {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">새 티켓 생성</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          고객 문의 사항을 새 티켓으로 등록합니다.
        </p>
      </div>

      <CreateTicketForm />
    </div>
  )
}
