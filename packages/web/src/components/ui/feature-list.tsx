import * as React from "react"
import { type LucideIcon, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export type FeatureIconColor = "cyan" | "pink" | "yellow" | "green" | "foreground"

export interface FeatureItem {
  icon?: LucideIcon
  text: string
  /** Optional secondary text */
  description?: string
}

export interface FeatureListProps {
  items: FeatureItem[]
  iconColor?: FeatureIconColor
  className?: string
  /** Default icon if item doesn't specify one */
  defaultIcon?: LucideIcon
  /** Size variant */
  size?: "sm" | "md" | "lg"
}

const iconColorClasses: Record<FeatureIconColor, string> = {
  cyan: "text-brutal-cyan",
  pink: "text-brutal-pink",
  yellow: "text-brutal-yellow",
  green: "text-brutal-green",
  foreground: "text-foreground",
}

const sizeClasses: Record<"sm" | "md" | "lg", { text: string; description: string; icon: string; gap: string }> = {
  sm: { text: "text-sm", description: "text-xs", icon: "w-4 h-4", gap: "gap-2" },
  md: { text: "text-base", description: "text-sm", icon: "w-5 h-5", gap: "gap-3" },
  lg: { text: "text-lg", description: "text-base", icon: "w-6 h-6", gap: "gap-4" },
}

export function FeatureList({
  items,
  iconColor = "cyan",
  className,
  defaultIcon = Circle,
  size = "md",
}: FeatureListProps) {
  const sizes = sizeClasses[size]

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const Icon = item.icon || defaultIcon
        return (
          <li key={index} className={cn("flex items-start", sizes.gap)}>
            <Icon className={cn("flex-shrink-0 mt-0.5", sizes.icon, iconColorClasses[iconColor])} />
            <div>
              <span className={cn("font-bold", sizes.text)}>{item.text}</span>
              {item.description && (
                <p className={cn("text-foreground/70", sizes.description)}>{item.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
