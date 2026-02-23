'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLogWithUser extends AuditLog {
  user: { name: string; email: string }
}

interface AuditLogTableProps {
  logs: AuditLogWithUser[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders a concise summary of before/after JSON changes.
 *
 * When both `before` and `after` are present, a key-by-key diff is displayed
 * showing only the fields that actually changed. When only one side exists
 * (e.g. a CREATE or DELETE action), it is stringified as-is, truncated to
 * avoid overflowing the table cell.
 */
function renderChanges(
  before: unknown,
  after: unknown
): React.ReactNode {
  if (!before && !after) {
    return <span className="text-muted-foreground">-</span>
  }

  // CREATE: only `after` is present
  if (!before && after) {
    return (
      <span className="text-xs text-green-700 break-all">
        {summarizeJson(after)}
      </span>
    )
  }

  // DELETE: only `before` is present
  if (before && !after) {
    return (
      <span className="text-xs text-red-700 break-all">
        {summarizeJson(before)}
      </span>
    )
  }

  // UPDATE: diff the two objects key-by-key
  const beforeObj = asRecord(before)
  const afterObj = asRecord(after)
  if (!beforeObj || !afterObj) {
    return (
      <span className="text-xs break-all">
        {summarizeJson(before)} → {summarizeJson(after)}
      </span>
    )
  }

  const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)])
  const diffs: { key: string; from: string; to: string }[] = []

  for (const key of allKeys) {
    const fromVal = JSON.stringify(beforeObj[key] ?? null)
    const toVal = JSON.stringify(afterObj[key] ?? null)
    if (fromVal !== toVal) {
      diffs.push({ key, from: beforeObj[key] as string, to: afterObj[key] as string })
    }
  }

  if (diffs.length === 0) {
    return <span className="text-muted-foreground text-xs">변경 없음</span>
  }

  return (
    <ul className="space-y-0.5">
      {diffs.map(({ key, from, to }) => (
        <li key={key} className="text-xs">
          <span className="font-medium">{key}</span>:{' '}
          <span className="text-red-600">{formatValue(from)}</span>
          {' → '}
          <span className="text-green-700">{formatValue(to)}</span>
        </li>
      ))}
    </ul>
  )
}

/** Safely narrow an unknown value to a Record, returning null otherwise. */
function asRecord(val: unknown): Record<string, unknown> | null {
  if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
    return val as Record<string, unknown>
  }
  return null
}

/** Display a primitive value in a human-readable way, truncated if needed. */
function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'null'
  const str = typeof val === 'string' ? val : JSON.stringify(val)
  return str.length > 40 ? str.slice(0, 37) + '...' : str
}

/** Stringify a JSON value and truncate for display in the table. */
function summarizeJson(val: unknown): string {
  const str = JSON.stringify(val)
  return str.length > 80 ? str.slice(0, 77) + '...' : str
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>시각</TableHead>
            <TableHead>사용자</TableHead>
            <TableHead>액션</TableHead>
            <TableHead>대상</TableHead>
            <TableHead>변경내용</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                감사 로그 없음
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {log.createdAt ? formatDateTime(log.createdAt) : '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {log.user.email}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-medium">{log.entityType}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {log.entityId.slice(0, 8)}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs">
                  {renderChanges(log.before, log.after)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
