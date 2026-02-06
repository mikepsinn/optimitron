import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type FeaturedInfoBgColor = "foreground" | "pink" | "cyan" | "yellow" | "background"

export interface FeaturedInfoCardProps {
  content: string | React.ReactNode
  bgColor?: FeaturedInfoBgColor
  centered?: boolean
  className?: string
  /** Optional title/header text */
  title?: string
}

const bgClasses: Record<FeaturedInfoBgColor, string> = {
  foreground: "bg-foreground text-background",
  pink: "bg-brutal-pink",
  cyan: "bg-brutal-cyan",
  yellow: "bg-brutal-yellow",
  background: "bg-background",
}

export function FeaturedInfoCard({
  content,
  bgColor = "foreground",
  centered = true,
  className,
  title,
}: FeaturedInfoCardProps) {
  return (
    <Card
      className={cn(
        "border-4 border-primary p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        bgClasses[bgColor],
        centered && "text-center",
        className
      )}
    >
      {title && (
        <p className="text-xl font-black uppercase mb-4">{title}</p>
      )}
      {typeof content === "string" ? (
        <p className="font-bold text-lg">{content}</p>
      ) : (
        content
      )}
    </Card>
  )
}
