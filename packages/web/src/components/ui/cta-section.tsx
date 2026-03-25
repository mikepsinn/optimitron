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

const bgColorClasses: Record<CTABgColor, { bg: string; text: string; glow: string }> = {
  pink: {
    bg: "bg-arcade-pink/10",
    text: "neon-pink",
    glow: "neon-box-pink",
  },
  yellow: {
    bg: "bg-arcade-yellow/10",
    text: "neon-yellow",
    glow: "neon-box-yellow",
  },
  cyan: {
    bg: "bg-arcade-cyan/10",
    text: "neon-cyan",
    glow: "neon-box-cyan",
  },
  black: {
    bg: "bg-background",
    text: "neon-green",
    glow: "neon-box-green",
  },
  foreground: {
    bg: "bg-background",
    text: "neon-cyan",
    glow: "neon-box-cyan",
  },
  red: {
    bg: "bg-arcade-red/10",
    text: "text-arcade-red",
    glow: "neon-box-pink",
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
    <section className={cn(colors.bg, "py-20 border-t border-arcade-green/30", className)}>
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className={cn("text-base sm:text-lg md:text-xl font-black uppercase tracking-wider mb-6", colors.text)}>
          ★★★ {heading} ★★★
        </h2>
        {description && (
          <p className={cn("text-[9px] sm:text-[10px] font-bold mb-8 text-arcade-green leading-relaxed", colors.text)}>{description}</p>
        )}
        {children}
      </div>
    </section>
  )
}
