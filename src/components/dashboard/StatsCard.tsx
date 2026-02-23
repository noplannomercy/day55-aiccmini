'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number
  description?: string
  colorClass?: string
}

/**
 * Displays a single KPI metric in a card format.
 * Used on the dashboard to show counts like total tickets, open tickets, etc.
 */
export function StatsCard({ title, value, description, colorClass }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-3xl font-bold tabular-nums', colorClass)}>
          {value.toLocaleString('ko-KR')}
        </p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
