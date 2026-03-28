import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 border-4 border-primary" />
        <Skeleton className="h-12 w-48 border-4 border-primary" />
        <Skeleton className="h-5 w-96 border-4 border-primary" />
      </div>

      {/* Notification preferences */}
      <Skeleton className="h-96 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
    </div>
  )
}
