import * as React from "react"
import { cn } from "@/lib/utils"

export type SectionBgColor = "background" | "foreground" | "pink" | "cyan" | "yellow" | "green" | "red" | "primary"
export type BorderPosition = "top" | "bottom" | "both" | "none"

export interface SectionContainerProps extends React.HTMLAttributes<HTMLElement> {
  bgColor?: SectionBgColor
  borderPosition?: BorderPosition
  children: React.ReactNode
  className?: string
  /** Padding size: sm = py-12, md = py-16, lg = py-20 */
  padding?: "sm" | "md" | "lg"
}

const bgClasses: Record<SectionBgColor, string> = {
  background: "bg-background",
  foreground: "bg-foreground text-background",
  pink: "bg-arcade-pink/10 text-arcade-pink",
  cyan: "bg-arcade-cyan/10 text-arcade-cyan",
  yellow: "bg-arcade-yellow/10 text-arcade-yellow",
  green: "bg-arcade-green/10 text-arcade-green",
  red: "bg-arcade-red/10 text-arcade-red",
  primary: "bg-primary/20 text-primary",
}

const borderClasses: Record<BorderPosition, string> = {
  top: "border-t border-arcade-green/30",
  bottom: "border-b border-arcade-green/30",
  both: "border-t border-b border-arcade-green/30",
  none: "",
}

const paddingClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "py-12",
  md: "py-16",
  lg: "py-20",
}

export function SectionContainer({
  bgColor = "background",
  borderPosition = "bottom",
  children,
  className,
  padding = "lg",
  ...props
}: SectionContainerProps) {
  return (
    <section
      className={cn(
        paddingClasses[padding],
        bgClasses[bgColor],
        borderClasses[borderPosition],
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
}
