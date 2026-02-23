'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PriorityChartProps {
  data: {
    low: number
    medium: number
    high: number
    urgent: number
  }
}

const PRIORITY_CONFIG = [
  { key: 'low', label: 'Low', color: '#9ca3af' },
  { key: 'medium', label: 'Medium', color: '#3b82f6' },
  { key: 'high', label: 'High', color: '#f97316' },
  { key: 'urgent', label: 'Urgent', color: '#ef4444' },
] as const

/**
 * Vertical bar chart showing ticket distribution by priority level.
 * Each bar is individually colored to match the priority severity.
 */
export function PriorityChart({ data }: PriorityChartProps) {
  const chartData = PRIORITY_CONFIG.map(({ key, label, color }) => ({
    name: label,
    value: data[key],
    color,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          우선순위별 티켓
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barSize={40}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0}건`, name ?? '']}
              cursor={{ fill: 'transparent' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
