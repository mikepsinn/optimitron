import * as React from "react"
import { AlertCircle, CheckCircle, AlertTriangle, Info, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type AlertType = "error" | "success" | "warning" | "info"

export interface AlertCardProps {
  type: AlertType
  message: string
  icon?: LucideIcon
  className?: string
  variant?: "brutal" | "minimal"
}

const typeConfig: Record<AlertType, { bg: string; border: string; text: string; DefaultIcon: LucideIcon }> = {
  error: {
    bg: "bg-brutal-red",
    border: "border-primary",
    text: "text-brutal-red-foreground",
    DefaultIcon: AlertCircle,
  },
  success: {
    bg: "bg-brutal-cyan",
    border: "border-primary",
    text: "text-brutal-cyan-foreground",
    DefaultIcon: CheckCircle,
  },
  warning: {
    bg: "bg-brutal-yellow",
    border: "border-primary",
    text: "text-brutal-yellow-foreground",
    DefaultIcon: AlertTriangle,
  },
  info: {
    bg: "bg-brutal-cyan",
    border: "border-primary",
    text: "text-brutal-cyan-foreground",
    DefaultIcon: Info,
  },
}

const minimalTypeConfig: Record<AlertType, { border: string; text: string; DefaultIcon: LucideIcon }> = {
  error: {
    border: "border-red-700",
    text: "text-red-700",
    DefaultIcon: AlertCircle,
  },
  success: {
    border: "border-neutral-950",
    text: "text-neutral-950",
    DefaultIcon: CheckCircle,
  },
  warning: {
    border: "border-neutral-950",
    text: "text-neutral-950",
    DefaultIcon: AlertTriangle,
  },
  info: {
    border: "border-neutral-950",
    text: "text-neutral-950",
    DefaultIcon: Info,
  },
}

export function AlertCard({ type, message, icon, className, variant = "brutal" }: AlertCardProps) {
  const config = typeConfig[type]
  const minimalConfig = minimalTypeConfig[type]
  const Icon = icon || (variant === "minimal" ? minimalConfig.DefaultIcon : config.DefaultIcon)

  return (
    <div
      className={cn(
        variant === "minimal"
          ? "border bg-white p-3"
          : "p-4 border-4 rounded",
        variant === "minimal" ? minimalConfig.border : config.bg,
        variant === "minimal" ? "" : config.border,
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "w-5 h-5 flex-shrink-0",
            variant === "minimal" ? minimalConfig.text : config.text,
          )}
        />
        <p className={cn("font-bold", variant === "minimal" ? minimalConfig.text : config.text)}>
          {message}
        </p>
      </div>
    </div>
  )
}
