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
  pink: "bg-brutal-pink",
  cyan: "bg-brutal-cyan",
  yellow: "bg-brutal-yellow",
  green: "bg-brutal-green",
  red: "bg-brutal-red",
  primary: "bg-primary text-primary-foreground",
}

const borderClasses: Record<BorderPosition, string> = {
  top: "border-t-4 border-primary",
  bottom: "border-b-4 border-primary",
  both: "border-t-4 border-b-4 border-primary",
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
