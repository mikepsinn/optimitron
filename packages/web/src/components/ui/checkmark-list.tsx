import * as React from "react"
import { Check, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type CheckmarkIconColor = "cyan" | "pink" | "green" | "yellow" | "foreground"

export interface CheckmarkListProps {
  items: string[]
  icon?: LucideIcon | "✓" | "✗" | "→"
  iconColor?: CheckmarkIconColor
  className?: string
  /** Size of the list items */
  size?: "sm" | "md" | "lg"
}

const iconColorClasses: Record<CheckmarkIconColor, string> = {
  cyan: "text-brutal-cyan",
  pink: "text-brutal-pink",
  green: "text-brutal-green",
  yellow: "text-brutal-yellow",
  foreground: "text-foreground",
}

const sizeClasses: Record<"sm" | "md" | "lg", { text: string; icon: string; gap: string }> = {
  sm: { text: "text-sm", icon: "w-4 h-4", gap: "gap-2" },
  md: { text: "text-base", icon: "w-5 h-5", gap: "gap-3" },
  lg: { text: "text-lg", icon: "w-6 h-6", gap: "gap-4" },
}

export function CheckmarkList({
  items,
  icon,
  iconColor = "cyan",
  className,
  size = "md",
}: CheckmarkListProps) {
  const sizes = sizeClasses[size]
  const isStringIcon = typeof icon === "string"
  const IconComponent = !isStringIcon ? (icon || Check) : null

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <li key={index} className={cn("flex items-start font-bold", sizes.gap, sizes.text)}>
          {isStringIcon ? (
            <span className={cn("text-2xl flex-shrink-0", iconColorClasses[iconColor])}>
              {icon}
            </span>
          ) : IconComponent ? (
            <IconComponent className={cn("flex-shrink-0 mt-0.5", sizes.icon, iconColorClasses[iconColor])} />
          ) : null}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
