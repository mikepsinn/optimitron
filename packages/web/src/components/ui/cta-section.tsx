import * as React from "react"
import { cn } from "@/lib/utils"

export type CTABgColor = "pink" | "yellow" | "cyan" | "black" | "foreground" | "red"

export interface CTASectionProps {
  heading: React.ReactNode
  description?: React.ReactNode
  bgColor?: CTABgColor
  children: React.ReactNode
  className?: string
}

const bgColorClasses: Record<CTABgColor, { bg: string; text: string }> = {
  pink: {
    bg: "bg-foreground",
    text: "text-background",
  },
  yellow: {
    bg: "bg-background",
    text: "text-foreground",
  },
  cyan: {
    bg: "bg-background",
    text: "text-foreground",
  },
  black: {
    bg: "bg-foreground",
    text: "text-background",
  },
  foreground: {
    bg: "bg-foreground",
    text: "text-background",
  },
  red: {
    bg: "bg-brutal-red",
    text: "text-brutal-red-foreground",
  },
}

export function CTASection({
  heading,
  description,
  bgColor = "pink",
  children,
  className,
}: CTASectionProps) {
  const colors = bgColorClasses[bgColor]

  return (
    <section className={cn(colors.bg, "border-t border-foreground/30 py-20", className)}>
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className={cn("text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-6", colors.text)}>
          {heading}
        </h2>
        {description && (
          <p className={cn("text-xl font-bold mb-8", colors.text)}>{description}</p>
        )}
        {children}
      </div>
    </section>
  )
}
