'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import type { Notification } from '@/types'

type NotificationListProps = {
  notifications: Notification[]
  unreadCount: number
}

/**
 * Client component that renders the full notification list with
 * mark-all-read and individual mark-read capabilities.
 *
 * After any mutation the page is refreshed via router.refresh() to pick up
 * the latest server-rendered data without a full page reload.
 */
export function NotificationList({ notifications, unreadCount }: NotificationListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleMarkAllRead() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' })
      if (!res.ok) {
        console.error('Failed to mark all notifications as read')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    if (!res.ok) {
      console.error('Failed to mark notification as read')
      return
    }
    router.refresh()
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-gray-900">알림이 없습니다</p>
        <p className="mt-1 text-sm text-muted-foreground">
          새로운 알림이 도착하면 여기에 표시됩니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={loading}
          >
            {loading ? '처리 중...' : '모두 읽음 처리'}
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={handleMarkRead}
          />
        ))}
      </div>
    </div>
  )
}
