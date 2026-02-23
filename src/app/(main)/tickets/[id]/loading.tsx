import { Skeleton } from '@/components/ui/skeleton'

export default function TicketDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back button skeleton */}
      <Skeleton className="h-8 w-32" />

      {/* Title + badges skeleton */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>

      {/* Description skeleton */}
      <div className="rounded-lg border p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Metadata grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      {/* Actions skeleton */}
      <div className="rounded-lg border p-4 space-y-3">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}
