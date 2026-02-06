import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type StepCardColor = "cyan" | "pink" | "yellow" | "green" | "purple" | "default"

export interface NumberedStepCardProps {
  step: number
  title: string
  description: string
  color?: StepCardColor
  className?: string
}

const colorClasses: Record<StepCardColor, string> = {
  cyan: "bg-brutal-cyan",
  pink: "bg-brutal-pink",
  yellow: "bg-brutal-yellow",
  green: "bg-brutal-green",
  purple: "bg-brutal-purple",
  default: "bg-background",
}

export function NumberedStepCard({
  step,
  title,
  description,
  color = "default",
  className,
}: NumberedStepCardProps) {
  return (
    <Card
      className={cn(
        "p-6 sm:p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-start gap-4 sm:gap-6">
        <div className="bg-primary text-background w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl flex-shrink-0">
          {step}
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
