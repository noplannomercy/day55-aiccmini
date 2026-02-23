'use client'

import Link from 'next/link'
import { Bell, LogOut, User } from 'lucide-react'
import type { SessionUser } from '@/types'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

type HeaderProps = {
  user: SessionUser
  unreadCount?: number
}

export function Header({ user, unreadCount = 0 }: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-sm text-gray-500">
        {/* 페이지 제목은 각 페이지에서 제공 */}
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/notifications"
          className="relative text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User size={16} />
          <span>{user.name}</span>
          <span className="text-xs text-gray-400">({user.role})</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
