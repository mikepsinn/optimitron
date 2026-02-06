"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AmountSelectorColor = "yellow" | "pink" | "cyan" | "green"

export interface AmountSelectorProps {
  amounts: number[]
  value: number | null
  onChange: (amount: number) => void
  columns?: 3 | 4 | 5
  /** Prefix for display (e.g., "$") */
  formatPrefix?: string
  /** Suffix for display (e.g., "/mo") */
  formatSuffix?: string
  activeColor?: AmountSelectorColor
  className?: string
}

const activeColorClasses: Record<AmountSelectorColor, string> = {
  yellow: "bg-brutal-yellow text-foreground",
  pink: "bg-brutal-pink text-white",
  cyan: "bg-brutal-cyan text-foreground",
  green: "bg-brutal-green text-foreground",
}

const columnClasses: Record<3 | 4 | 5, string> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
}

export function AmountSelector({
  amounts,
  value,
  onChange,
  columns = 3,
  formatPrefix = "$",
  formatSuffix = "",
  activeColor = "yellow",
  className,
}: AmountSelectorProps) {
  return (
    <div className={cn("grid gap-3", columnClasses[columns], className)}>
      {amounts.map((amount) => (
        <Button
          key={amount}
          type="button"
          onClick={() => onChange(amount)}
          className={cn(
            "h-12 font-black border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            value === amount
              ? activeColorClasses[activeColor]
              : "bg-background text-foreground"
          )}
        >
          {formatPrefix}{amount}{formatSuffix}
        </Button>
      ))}
    </div>
  )
}
