import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { Card } from "@/components/retroui/Card"
import { cn } from "@/lib/utils"

export type StatCardColor = "yellow" | "pink" | "cyan" | "green" | "default"
export type StatCardSize = "sm" | "md" | "lg"

export interface StatCardProps {
  value: string | number
  label: string
  description?: string
  icon?: LucideIcon
  color?: StatCardColor
  size?: StatCardSize
  className?: string
  /** Whether to show hover animation (translate + shadow change) */
  hover?: boolean
}

const colorClasses: Record<StatCardColor, string> = {
  yellow: "bg-brutal-yellow",
  pink: "bg-brutal-pink text-brutal-pink-foreground",
  cyan: "bg-brutal-cyan",
  green: "bg-brutal-green",
  default: "bg-background",
}

const sizeClasses: Record<StatCardSize, { value: string; label: string; description: string; padding: string }> = {
  sm: {
    value: "text-2xl sm:text-3xl",
    label: "text-xs",
    description: "text-xs",
    padding: "p-4",
  },
  md: {
    value: "text-3xl sm:text-4xl",
    label: "text-sm",
    description: "text-sm",
    padding: "p-6",
  },
  lg: {
    value: "text-4xl sm:text-5xl md:text-6xl",
    label: "text-lg sm:text-xl",
    description: "text-sm sm:text-base",
    padding: "p-6 sm:p-8",
  },
}

export function StatCard({
  value,
  label,
  description,
  icon: Icon,
  color = "default",
  size = "md",
  className,
  hover = false,
}: StatCardProps) {
  const sizes = sizeClasses[size]
  const colorClass = colorClasses[color]
  const hoverClass = hover
    ? "hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
    : ""

  return (
    <Card
      className={cn(
        sizes.padding,
        "border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        colorClass,
        hoverClass,
        className
      )}
    >
      {Icon && <Icon className="h-12 w-12 mx-auto mb-4" />}
      <div className={cn(sizes.value, "font-black mb-2", Icon && "text-center")}>{value}</div>
      <div className={cn(sizes.label, "font-bold uppercase", Icon && "text-center")}>{label}</div>
      {description && (
        <p className={cn(sizes.description, "mt-2", Icon && "text-center")}>{description}</p>
      )}
    </Card>
  )
}

export interface StatCardGridProps {
  stats: StatCardProps[]
  columns?: 2 | 3 | 4
  className?: string
}

const columnClasses: Record<2 | 3 | 4, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
}

export function StatCardGrid({ stats, columns = 3, className }: StatCardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-6 sm:gap-8", columnClasses[columns], className)}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
