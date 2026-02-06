import * as React from "react"
import { cn } from "@/lib/utils"

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full"

export interface ContainerProps {
  size?: ContainerSize
  children: React.ReactNode
  className?: string
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  full: "max-w-full",
}

export function Container({ size = "xl", children, className }: ContainerProps) {
  return (
    <div className={cn("mx-auto px-4", sizeClasses[size], className)}>
      {children}
    </div>
  )
}
