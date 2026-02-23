import { cn, formatRelativeTime } from '@/lib/utils'
import type { Notification } from '@/types'

const TYPE_ICONS: Record<string, string> = {
  ticket_assigned: '\uD83C\uDFAB',
  status_changed: '\uD83D\uDD04',
  comment_added: '\uD83D\uDCAC',
}

type NotificationItemProps = {
  notification: Notification
  onMarkRead: (id: string) => void
}

/**
 * Renders a single notification row with visual differentiation between
 * read and unread states. Clicking an unread notification marks it as read.
 */
export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const icon = TYPE_ICONS[notification.type] ?? '\uD83D\uDD14'
  const isUnread = !notification.isRead

  function handleClick() {
    if (isUnread) {
      onMarkRead(notification.id)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full text-left flex items-start gap-3 p-4 rounded-lg transition-colors',
        isUnread
          ? 'bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100'
          : 'bg-white border-l-4 border-transparent hover:bg-gray-50'
      )}
    >
      <span className="text-lg shrink-0 mt-0.5" role="img" aria-label={notification.type}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm truncate',
            isUnread ? 'font-bold text-gray-900' : 'font-normal text-gray-700'
          )}
        >
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {notification.createdAt ? formatRelativeTime(notification.createdAt) : ''}
        </p>
      </div>
      {isUnread && (
        <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-blue-500" />
      )}
    </button>
  )
}
