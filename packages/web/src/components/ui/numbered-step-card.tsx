import * as React from "react"
import { Card } from "@/components/retroui/Card"
import { cn } from "@/lib/utils"

export type StepCardColor = "cyan" | "pink" | "yellow" | "green" | "purple" | "default"

export interface NumberedStepCardProps {
  step: number
  /** Override the number badge with a custom label (e.g. "LEVEL 2", "BOSS LEVEL") */
  label?: string
  title: string
  description: React.ReactNode
  color?: StepCardColor
  className?: string
}

const colorClasses: Record<StepCardColor, string> = {
  cyan: "bg-background text-foreground",
  pink: "bg-background text-foreground",
  yellow: "bg-background text-foreground",
  green: "bg-background text-foreground",
  purple: "bg-background text-foreground",
  default: "bg-background",
}

export function NumberedStepCard({
  step,
  label,
  title,
  description,
  color = "default",
  className,
}: NumberedStepCardProps) {
  return (
    <Card
      className={cn(
        "p-6 sm:p-8 border border-foreground shadow-none",
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-start gap-4 sm:gap-6">
        <div className="bg-background text-foreground border border-foreground w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-black text-xl sm:text-2xl flex-shrink-0">
          {label ?? step}
        </div>
        <div>
          <h3 className="font-black text-xl sm:text-2xl mb-3">{title}</h3>
          <p className="text-base sm:text-lg font-bold">{description}</p>
        </div>
      </div>
    </Card>
  )
}

export interface NumberedStepListProps {
  steps: Omit<NumberedStepCardProps, "step">[]
  startAt?: number
  className?: string
}

export function NumberedStepList({ steps, startAt = 1, className }: NumberedStepListProps) {
  return (
    <div className={cn("space-y-6 sm:space-y-8", className)}>
      {steps.map((step, index) => (
        <NumberedStepCard key={index} step={startAt + index} {...step} />
      ))}
    </div>
  )
}
