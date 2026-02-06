import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type IconBoxBgColor = "cyan" | "pink" | "yellow" | "green" | "foreground"

export interface IconBoxCardProps {
  icon: LucideIcon
  title: string
  description: string
  iconBgColor?: IconBoxBgColor
  className?: string
  /** Optional additional content below the description */
  children?: React.ReactNode
}

const iconBgClasses: Record<IconBoxBgColor, string> = {
  cyan: "bg-brutal-cyan",
  pink: "bg-brutal-pink",
  yellow: "bg-brutal-yellow",
  green: "bg-brutal-green",
  foreground: "bg-foreground text-background",
}

export function IconBoxCard({
  icon: Icon,
  title,
  description,
  iconBgColor = "cyan",
  className,
  children,
}: IconBoxCardProps) {
  return (
    <Card
      className={cn(
        "border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-card",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "border-4 border-primary w-16 h-16 flex items-center justify-center",
            iconBgClasses[iconBgColor]
          )}
        >
          <Icon className="h-8 w-8" />
        </div>
      </div>
      <h3 className="text-2xl font-black uppercase mb-3">{title}</h3>
      <p className="font-bold text-lg">{description}</p>
      {children}
    </Card>
  )
}

export interface IconBoxCardGridProps {
  cards: IconBoxCardProps[]
  columns?: 2 | 3 | 4
  className?: string
}

const columnClasses: Record<2 | 3 | 4, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
}

export function IconBoxCardGrid({ cards, columns = 3, className }: IconBoxCardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-8", columnClasses[columns], className)}>
      {cards.map((card, index) => (
        <IconBoxCard key={index} {...card} />
      ))}
    </div>
  )
}
