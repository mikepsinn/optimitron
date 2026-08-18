import { Skeleton } from "@/components/ui/skeleton"

export default function CensusLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32 border-4 border-primary" />
        <Skeleton className="h-10 w-80 border-4 border-primary" />
        <Skeleton className="h-5 w-96 border-4 border-primary" />
      </div>

      {/* CTA grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-96 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        <Skeleton className="h-96 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
      </div>

      {/* History */}
      <Skeleton className="h-48 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
    </div>
  )
}
