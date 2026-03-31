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
    title: "text-2xl md:text-3xl",
    subtitle: "text-base",
    spacing: "mb-6",
  },
  md: {
    title: "text-3xl md:text-4xl",
    subtitle: "text-lg",
    spacing: "mb-8",
  },
  lg: {
    title: "text-3xl sm:text-4xl md:text-5xl",
    subtitle: "text-lg sm:text-xl",
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
      <h2 className={cn(sizes.title, "font-pixel uppercase tracking-wider mb-4")}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn(sizes.subtitle, "font-terminal", centered && "max-w-3xl mx-auto")}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
