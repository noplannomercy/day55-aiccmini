import { Skeleton } from '@/components/ui/skeleton'

export default function KBDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back button skeleton */}
      <Skeleton className="h-8 w-44" />

      {/* Title + version badge skeleton */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-10" />
      </div>

      {/* Metadata skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="rounded-lg border p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Tags skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-18" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  )
}
