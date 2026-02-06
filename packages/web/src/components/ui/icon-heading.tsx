import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type IconHeadingSize = "sm" | "md" | "lg"
export type IconBoxColor = "cyan" | "pink" | "yellow" | "green" | "foreground"

export interface IconHeadingProps {
  /** Lucide icon component or any React node (e.g. emoji span) */
  icon: LucideIcon | React.ReactNode
  title: string
  size?: IconHeadingSize
  iconColor?: IconBoxColor
  className?: string
  /** Optional subtitle below the title */
  subtitle?: string
}

const iconBoxColors: Record<IconBoxColor, string> = {
  cyan: "bg-brutal-cyan",
  pink: "bg-brutal-pink",
  yellow: "bg-brutal-yellow",
  green: "bg-brutal-green",
  foreground: "bg-foreground text-background",
}

const sizeClasses: Record<IconHeadingSize, { box: string; icon: string; title: string; subtitle: string }> = {
  sm: {
    box: "w-12 h-12",
    icon: "h-6 w-6",
    title: "text-xl",
    subtitle: "text-sm",
  },
  md: {
    box: "w-16 h-16",
    icon: "h-8 w-8",
    title: "text-2xl",
    subtitle: "text-base",
  },
  lg: {
    box: "w-20 h-20",
    icon: "h-10 w-10",
    title: "text-3xl",
    subtitle: "text-lg",
  },
}

function isLucideIcon(icon: LucideIcon | React.ReactNode): icon is LucideIcon {
  return typeof icon === "function"
}

export function IconHeading({
  icon,
  title,
  size = "md",
  iconColor = "cyan",
  className,
  subtitle,
}: IconHeadingProps) {
  const sizes = sizeClasses[size]

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div
        className={cn(
          "border-4 border-primary flex items-center justify-center flex-shrink-0",
          iconBoxColors[iconColor],
          sizes.box
        )}
      >
        {isLucideIcon(icon) ? (
          React.createElement(icon, { className: sizes.icon })
        ) : (
          icon
        )}
      </div>
      <div>
        <h3 className={cn(sizes.title, "font-black uppercase")}>{title}</h3>
        {subtitle && (
          <p className={cn(sizes.subtitle, "font-bold")}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}
