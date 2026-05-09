import * as React from "react"
import { Card } from "@/components/retroui/Card"
import { cn } from "@/lib/utils"

export type BrutalCardBgColor = "background" | "foreground" | "pink" | "cyan" | "yellow" | "green" | "red" | "default"
export type BrutalCardShadowSize = 4 | 8 | 12
export type BrutalCardPadding = "sm" | "md" | "lg"

export interface BrutalCardProps {
  bgColor?: BrutalCardBgColor
  shadowSize?: BrutalCardShadowSize
  padding?: BrutalCardPadding
  /** Enable hover animation (translate + shadow change) */
  hover?: boolean
  children: React.ReactNode
  className?: string
}

const bgClasses: Record<BrutalCardBgColor, string> = {
  background: "bg-background text-foreground",
  foreground: "bg-foreground text-background",
  pink: "bg-brutal-pink text-brutal-pink-foreground",
  cyan: "bg-brutal-cyan text-brutal-cyan-foreground",
  yellow: "bg-brutal-yellow text-brutal-yellow-foreground",
  green: "bg-brutal-green text-brutal-green-foreground",
  red: "bg-brutal-red text-brutal-red-foreground",
  default: "bg-card text-card-foreground",
}

// Treaty migration 2026-05-08: hard offset shadows removed. Prop
// retained as no-op so consumers don't need updates.
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
  // Treaty migration 2026-05-08: dropped translate/hard-shadow hover
  // animation. Hover now nudges background to muted — quiet, not arcade.
  const hoverClass = hover ? "transition-colors hover:bg-muted" : ""

  return (
    <Card
      className={cn(
        // Treaty migration 2026-05-08: border-4 border-primary →
        // border-2 border-foreground.
        "border-2 border-foreground",
        paddingClasses[padding],
        shadowClasses[shadowSize],
        bgClasses[bgColor],
        hoverClass,
        className
      )}
    >
      {children}
    </Card>
  )
}
