"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ToggleActiveColor = "pink" | "cyan" | "yellow" | "green"

export interface ToggleOption {
  value: string
  label: string
}

export interface ToggleButtonGroupProps {
  options: ToggleOption[]
  value: string
  onChange: (value: string) => void
  activeColor?: ToggleActiveColor
  className?: string
  /** Size of buttons */
  size?: "sm" | "md" | "lg"
}

const activeColorClasses: Record<ToggleActiveColor, string> = {
  pink: "bg-brutal-pink text-white",
  cyan: "bg-brutal-cyan text-foreground",
  yellow: "bg-brutal-yellow text-foreground",
  green: "bg-brutal-green text-foreground",
}

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-10 text-sm",
  md: "h-12 text-base",
  lg: "h-14 text-lg",
}

export function ToggleButtonGroup({
  options,
  value,
  onChange,
  activeColor = "pink",
  className,
  size = "md",
}: ToggleButtonGroupProps) {
  return (
    <div className={cn("flex gap-4", className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 font-black uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            sizeClasses[size],
            value === option.value
              ? activeColorClasses[activeColor]
              : "bg-background text-foreground"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
