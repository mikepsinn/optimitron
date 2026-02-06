import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type IconCardColor = "red" | "green" | "cyan" | "pink" | "yellow" | "purple" | "default"
export type IconPosition = "left" | "top" | "center"

export interface IconCardProps {
  icon: LucideIcon
  title: string
  description: string
  color?: IconCardColor
  iconPosition?: IconPosition
  className?: string
}

const colorClasses: Record<IconCardColor, string> = {
  red: "bg-brutal-red",
  green: "bg-brutal-green",
  cyan: "bg-brutal-cyan",
  pink: "bg-brutal-pink",
  yellow: "bg-brutal-yellow",
  purple: "bg-brutal-purple",
  default: "bg-background",
}

export function IconCard({
  icon: Icon,
  title,
  description,
  color = "default",
  iconPosition = "left",
  className,
}: IconCardProps) {
  const colorClass = colorClasses[color]

  if (iconPosition === "center" || iconPosition === "top") {
    return (
      <Card
        className={cn(
          "p-6 sm:p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
          colorClass,
          iconPosition === "center" && "text-center",
          className
        )}
      >
        <Icon className={cn("w-12 h-12 sm:w-16 sm:h-16 mb-4", iconPosition === "center" && "mx-auto")} />
        <h3 className="font-black text-xl sm:text-2xl mb-2">{title}</h3>
        <p className="font-bold">{description}</p>
      </Card>
    )
  }

  // iconPosition === "left"
  return (
    <Card
      className={cn(
        "p-6 sm:p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        colorClass,
        className
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        <Icon className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" />
        <div>
          <h3 className="font-black text-xl sm:text-2xl mb-2">{title}</h3>
          <p className="text-base sm:text-lg font-bold">{description}</p>
        </div>
      </div>
    </Card>
  )
}

export interface ChecklistCardProps {
  icon: LucideIcon
  title: string
  description: string
  color?: IconCardColor
  className?: string
}

export function ChecklistCard({
  icon: Icon,
  title,
  description,
  color = "green",
  className,
}: ChecklistCardProps) {
  return (
    <Card
      className={cn(
        "p-6 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Icon className="w-8 h-8 flex-shrink-0" />
        <div>
          <h3 className="font-black text-xl mb-2">{title}</h3>
          <p className="font-bold">{description}</p>
        </div>
      </div>
    </Card>
  )
}
