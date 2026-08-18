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
  pink: "bg-background text-foreground",
  cyan: "bg-background text-foreground",
  yellow: "bg-background text-foreground",
  green: "bg-background text-foreground",
  red: "bg-background text-foreground",
  primary: "bg-primary text-primary-foreground",
}

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
