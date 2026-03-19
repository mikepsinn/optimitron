import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type ComparisonColor = "pink" | "cyan" | "yellow" | "green" | "foreground" | "default"

export interface ComparisonSide {
  value: string
  label: string
  subtitle?: string
  color?: ComparisonColor
}

export interface ComparisonCardProps {
  left: ComparisonSide
  right: ComparisonSide
  className?: string
  /** Optional title above the comparison */
  title?: string
}

const colorClasses: Record<ComparisonColor, string> = {
  pink: "text-brutal-pink",
  cyan: "text-brutal-cyan",
  yellow: "text-brutal-yellow",
  green: "text-brutal-green",
  foreground: "text-foreground",
  default: "",
}

function ComparisonSideDisplay({ value, label, subtitle, color = "default" }: ComparisonSide) {
  return (
    <div className="bg-background border-4 border-primary p-6 text-center">
      <div className={cn("text-4xl font-black mb-2", colorClasses[color])}>
        {value}
      </div>
      <div className="font-black uppercase text-sm mb-2">{label}</div>
      {subtitle && (
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      )}
    </div>
  )
}

export function ComparisonCard({ left, right, className, title }: ComparisonCardProps) {
  return (
    <Card
      className={cn(
        "border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        className
      )}
    >
      {title && (
        <h3 className="text-2xl font-black uppercase mb-6 text-center">{title}</h3>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <ComparisonSideDisplay {...left} />
        <ComparisonSideDisplay {...right} />
      </div>
    </Card>
  )
}
