import * as React from "react"
import { cn } from "@/lib/utils"

export type CTABgColor = "pink" | "yellow" | "cyan" | "black" | "foreground" | "red"

export interface CTASectionProps {
  heading: React.ReactNode
  description?: string
  bgColor?: CTABgColor
  children: React.ReactNode
  className?: string
}

const bgColorClasses: Record<CTABgColor, { bg: string; text: string }> = {
  pink: {
    bg: "bg-brutal-pink",
    text: "text-brutal-pink-foreground",
  },
  yellow: {
    bg: "bg-brutal-yellow",
    text: "text-foreground",
  },
  cyan: {
    bg: "bg-brutal-cyan",
    text: "text-foreground",
  },
  black: {
    bg: "bg-black",
    text: "text-brutal-pink-foreground",
  },
  foreground: {
    bg: "bg-foreground",
    text: "text-background",
  },
  red: {
    bg: "bg-brutal-red",
    text: "text-foreground",
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
    <section className={cn(colors.bg, "py-20 border-t-4 border-primary", className)}>
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
