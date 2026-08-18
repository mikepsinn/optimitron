import * as React from "react"
import { cn } from "@/lib/utils"

export type BrutalCardBgColor = "background" | "foreground" | "pink" | "cyan" | "yellow" | "green" | "red" | "default"
export type BrutalCardShadowSize = 4 | 8 | 12
export type BrutalCardPadding = "sm" | "md" | "lg"

export interface BrutalCardProps {
  bgColor?: BrutalCardBgColor
  shadowSize?: BrutalCardShadowSize
  padding?: BrutalCardPadding
  /** Enable hover state. */
  hover?: boolean
  children: React.ReactNode
  className?: string
}

const bgClasses: Record<BrutalCardBgColor, string> = {
  background: "bg-background text-foreground",
  foreground: "bg-foreground text-background",
  pink: "bg-background text-foreground",
  cyan: "bg-background text-foreground",
  yellow: "bg-background text-foreground",
  green: "bg-background text-foreground",
  red: "bg-background text-foreground",
  default: "bg-background text-foreground",
}

// Retain shadowSize as a no-op so existing consumers do not need updates.
const shadowClasses: Record<BrutalCardShadowSize, string> = {
  4: "",
  8: "",
  12: "",
}

const paddingClasses: Record<BrutalCardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
}

export function BrutalCard({
  bgColor = "default",
  shadowSize = 8,
  padding = "md",
  hover = false,
  children,
  className,
}: BrutalCardProps) {
  const hoverClass = hover ? "transition-colors hover:bg-muted" : ""

  return (
    <div
      className={cn(
        "border border-foreground",
        paddingClasses[padding],
        shadowClasses[shadowSize],
        bgClasses[bgColor],
        hoverClass,
        className
      )}
    >
      {children}
    </div>
  )
}
