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
  background: "bg-background text-foreground",
  foreground: "bg-foreground text-background",
  pink: "bg-brutal-pink text-brutal-pink-foreground",
  cyan: "bg-brutal-cyan text-brutal-cyan-foreground",
  yellow: "bg-brutal-yellow text-brutal-yellow-foreground",
  green: "bg-brutal-green text-brutal-green-foreground",
  red: "bg-brutal-red text-brutal-red-foreground",
  primary: "bg-primary text-primary-foreground",
}

// Treaty migration 2026-05-08: thick novelty borders → thin treaty
// rules. border-t-4 / border-b-4 → border-t / border-b;
// border-primary → border-foreground.
const borderClasses: Record<BorderPosition, string> = {
  top: "border-t border-foreground",
  bottom: "border-b border-foreground",
  both: "border-t border-b border-foreground",
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
