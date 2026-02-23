'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatusChartProps {
  data: {
    open: number
    in_progress: number
    resolved: number
    closed: number
  }
}

const STATUS_CONFIG = [
  { key: 'open', label: 'Open', color: '#3b82f6' },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'resolved', label: 'Resolved', color: '#22c55e' },
  { key: 'closed', label: 'Closed', color: '#9ca3af' },
] as const

/**
 * Pie chart showing ticket distribution by status.
 * Renders an empty-state message when there are no tickets.
 */
export function StatusChart({ data }: StatusChartProps) {
  const chartData = STATUS_CONFIG.map(({ key, label, color }) => ({
    name: label,
    value: data[key],
    color,
  }))

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          상태별 티켓
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            데이터 없음
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0}건`, name ?? '']}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
