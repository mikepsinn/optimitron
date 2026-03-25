import * as React from "react"
import { cn } from "@/lib/utils"

export type SectionHeaderSize = "sm" | "md" | "lg"

export interface SectionHeaderProps {
  title: string | React.ReactNode
  subtitle?: string | React.ReactNode
  size?: SectionHeaderSize
  className?: string
  /** Center align the header (default: true) */
  centered?: boolean
}

const sizeClasses: Record<SectionHeaderSize, { title: string; subtitle: string; spacing: string }> = {
  sm: {
    title: "text-sm md:text-base neon-cyan",
    subtitle: "text-[9px] text-arcade-green",
    spacing: "mb-6",
  },
  md: {
    title: "text-base md:text-lg neon-cyan",
    subtitle: "text-[9px] sm:text-[10px] text-arcade-green",
    spacing: "mb-8",
  },
  lg: {
    title: "text-lg sm:text-xl md:text-2xl neon-pink",
    subtitle: "text-[9px] sm:text-[10px] text-arcade-yellow",
    spacing: "mb-12",
  },
}

export function SectionHeader({
  title,
  subtitle,
  size = "md",
  className,
  centered = true,
}: SectionHeaderProps) {
  const sizes = sizeClasses[size]

  return (
    <div className={cn(sizes.spacing, centered && "text-center", className)}>
      <h2 className={cn(sizes.title, "font-black uppercase tracking-wider mb-4")}>
        ═══ {title} ═══
      </h2>
      {subtitle && (
        <p className={cn(sizes.subtitle, "font-bold leading-relaxed", centered && "max-w-3xl mx-auto")}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
