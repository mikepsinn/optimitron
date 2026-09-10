import type { ReactNode } from "react"
import { cn } from "../cn"

export interface AllocationBarSegment {
  label: string
  value: number
  displayValue: string
  colorClassName: string
  valueClassName?: string
  content?: ReactNode
}

interface AllocationBarProps {
  label: ReactNode
  segments: readonly AllocationBarSegment[]
  /** All bars in a comparison must use the same scale. */
  maxValue?: number
  size?: "compact" | "default" | "large"
  showTrack?: boolean
}

export function AllocationBar({
  label,
  segments,
  maxValue = 100,
  size = "default",
  showTrack = true,
}: AllocationBarProps) {
  const single = segments.length === 1 ? segments[0] : undefined
  const scale = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 100

  return (
    <figure className="min-w-0 space-y-2">
      <figcaption className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-bold",
        size === "compact" ? "text-xs" : size === "large" ? "text-lg sm:text-2xl font-black uppercase" : "text-base sm:text-lg",
      )}>
        <div>{label}</div>
        {single ? <span className={cn("tabular-nums font-black", single.valueClassName, size === "large" && "text-2xl sm:text-3xl")}>{single.displayValue}</span> : null}
      </figcaption>
      <div
        aria-hidden="true"
        className={cn(
          "flex w-full overflow-hidden",
          showTrack && "border-2 border-primary bg-muted",
          size === "compact" ? "h-6" : size === "large" ? "h-24" : "h-10 sm:h-12",
        )}
      >
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={cn("flex h-full shrink-0 items-center justify-center", segment.colorClassName, !showTrack && segment.value > 0 && "border-2 border-primary")}
            style={{ width: `${Number.isFinite(segment.value) ? Math.min(100, Math.max(0, segment.value / scale * 100)) : 0}%` }}
          >
            {segment.content}
          </div>
        ))}
      </div>
      {!single ? (
        <dl className="flex flex-wrap justify-between gap-x-6 gap-y-2">
          {segments.map((segment) => (
            <div key={segment.label}>
              <dt className="flex items-center gap-2 text-sm font-bold">
                <span aria-hidden="true" className={cn("h-3 w-3 shrink-0", segment.colorClassName)} />
                {segment.label}
              </dt>
              <dd className="text-2xl sm:text-3xl font-black tabular-nums">{segment.displayValue}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </figure>
  )
}
