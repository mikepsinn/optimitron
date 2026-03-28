import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-24 border-4 border-primary" />
        <Skeleton className="h-12 w-72 border-4 border-primary" />
        <Skeleton className="h-5 w-96 border-4 border-primary" />
      </div>

      {/* Player name banner */}
      <Skeleton className="h-24 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />

      {/* Profile card */}
      <Skeleton className="h-96 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />

      {/* Connected accounts */}
      <Skeleton className="h-64 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />

      {/* Email signature */}
      <Skeleton className="h-48 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
    </div>
  )
}
