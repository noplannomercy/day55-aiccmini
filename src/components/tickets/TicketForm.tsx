'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Ticket } from '@/types'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const ticketFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.'),
  description: z.string().min(1, '설명을 입력해 주세요.'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  customerId: z
    .string()
    .uuid('올바른 고객 ID 형식이 아닙니다.')
    .optional()
    .or(z.literal('')),
})

export type TicketFormData = z.infer<typeof ticketFormSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TicketFormProps {
  ticket?: Ticket
  onSubmit: (data: TicketFormData) => Promise<void>
  isLoading?: boolean
}

/**
 * Reusable form for creating and editing tickets.
 *
 * Uses react-hook-form with zod validation for client-side field checks.
 * The parent component is responsible for the actual API call via the
 * onSubmit callback, keeping this component purely presentational
 * with respect to data persistence.
 */
export function TicketForm({ ticket, onSubmit, isLoading }: TicketFormProps) {
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: ticket?.title ?? '',
      description: ticket?.description ?? '',
      priority: ticket?.priority ?? 'medium',
      customerId: ticket?.customerId ?? '',
    },
  })

  async function handleSubmit(data: TicketFormData) {
    // Normalise empty customerId to undefined so it is omitted from the payload
    const payload: TicketFormData = {
      ...data,
      customerId: data.customerId || undefined,
    }
    await onSubmit(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목</FormLabel>
              <FormControl>
                <Input placeholder="티켓 제목을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="문제 또는 요청 사항을 상세히 작성하세요"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>우선순위</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="우선순위 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Customer ID */}
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>고객 ID (선택)</FormLabel>
              <FormControl>
                <Input placeholder="UUID 형식의 고객 ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? ticket
                ? '수정 중...'
                : '생성 중...'
              : ticket
                ? '수정'
                : '생성'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
