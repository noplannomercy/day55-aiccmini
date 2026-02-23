import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getUnreadCount } from '@/services/notification.service'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  const unreadCount = await getUnreadCount(user.tenantId, user.id)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <Header user={user} unreadCount={unreadCount} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
