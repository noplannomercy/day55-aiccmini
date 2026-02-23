'use client'

import { Button } from '@/components/ui/button'

export default function TicketsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-medium text-gray-900">
        티켓 목록을 불러오는 중 오류가 발생했습니다.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {error.message || '잠시 후 다시 시도해 주세요.'}
      </p>
      <Button variant="outline" className="mt-4" onClick={reset}>
        다시 시도
      </Button>
    </div>
  )
}
