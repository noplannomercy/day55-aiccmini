'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function KBDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-medium text-gray-900">
        문서를 불러오는 중 오류가 발생했습니다.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {error.message || '존재하지 않는 문서이거나 접근 권한이 없습니다.'}
      </p>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={reset}>
          다시 시도
        </Button>
        <Link href="/kb">
          <Button variant="outline">목록으로 돌아가기</Button>
        </Link>
      </div>
    </div>
  )
}
