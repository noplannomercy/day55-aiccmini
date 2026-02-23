import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS class names intelligently, resolving conflicts.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date as a localized Korean date string.
 * @example formatDate('2024-01-15') // "2024년 1월 15일"
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Formats a date as a localized Korean date-time string.
 * @example formatDateTime('2024-01-15T14:30:00') // "2024년 1월 15일 오후 02:30"
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Returns a human-readable relative time string in Korean.
 * @example formatRelativeTime(fiveMinutesAgo) // "5분 전"
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

/**
 * Calculates the SQL OFFSET value for pagination.
 * @param page - 1-based page number
 * @param limit - Number of items per page
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Calculates the total number of pages for pagination.
 * @param total - Total number of items
 * @param limit - Number of items per page
 */
export function getTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit)
}
