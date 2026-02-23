'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  Bell,
  Users,
  Shield,
  Zap,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  minRole: UserRole | 'all'
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: '대시보드', icon: <LayoutDashboard size={18} />, minRole: 'all' },
  { href: '/tickets', label: '티켓', icon: <Ticket size={18} />, minRole: 'agent' },
  { href: '/kb', label: '지식베이스', icon: <BookOpen size={18} />, minRole: 'all' },
  { href: '/notifications', label: '알림', icon: <Bell size={18} />, minRole: 'all' },
  { href: '/settings/rules', label: '자동화 룰', icon: <Zap size={18} />, minRole: 'admin' },
  { href: '/settings/users', label: '사용자 관리', icon: <Users size={18} />, minRole: 'admin' },
  { href: '/settings/audit', label: '감사로그', icon: <Shield size={18} />, minRole: 'admin' },
]

/**
 * Determines whether a user with the given role has access to a menu item.
 * Role hierarchy: admin > agent > viewer.
 * 'all' means every role has access.
 */
function hasAccess(userRole: UserRole, minRole: UserRole | 'all'): boolean {
  if (minRole === 'all') return true
  if (minRole === 'viewer') return true
  if (minRole === 'agent') return userRole === 'agent' || userRole === 'admin'
  if (minRole === 'admin') return userRole === 'admin'
  return false
}

type SidebarProps = {
  userRole: UserRole
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(item => hasAccess(userRole, item.minRole))

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">AICC Mini</h1>
      </div>
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
