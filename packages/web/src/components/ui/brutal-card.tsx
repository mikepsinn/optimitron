import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type BrutalCardBgColor = "background" | "foreground" | "pink" | "cyan" | "yellow" | "green" | "default"
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
  background: "bg-background",
  foreground: "bg-foreground text-background",
  pink: "bg-brutal-pink",
  cyan: "bg-brutal-cyan",
  yellow: "bg-brutal-yellow",
  green: "bg-brutal-green",
  default: "bg-card",
}

const shadowClasses: Record<BrutalCardShadowSize, string> = {
  4: "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
  8: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
  12: "shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
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
  const hoverClass = hover
    ? "hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
    : ""

  return (
    <Card
      className={cn(
        "border-4 border-primary",
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
