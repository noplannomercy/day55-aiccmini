import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { listNotifications, getUnreadCount } from '@/services/notification.service'
import { NotificationList } from '@/components/notifications/NotificationList'

/**
 * /notifications -- server component that fetches the current user's
 * notifications directly from the service layer (no internal HTTP round-trip)
 * and passes them to the NotificationList client component.
 */
export default async function NotificationsPage() {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  const [result, unreadCount] = await Promise.all([
    listNotifications(session.tenantId, session.id),
    getUnreadCount(session.tenantId, session.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">알림</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          티켓 배정, 상태 변경, 댓글 등의 알림을 확인합니다.
        </p>
      </div>
      <NotificationList
        notifications={result.data}
        unreadCount={unreadCount}
      />
    </div>
  )
}
