import * as React from "react"
import { AlertCircle, CheckCircle, AlertTriangle, Info, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type AlertType = "error" | "success" | "warning" | "info"

export interface AlertCardProps {
  type: AlertType
  message: string
  icon?: LucideIcon
  className?: string
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

export function AlertCard({ type, message, icon, className }: AlertCardProps) {
  const config = typeConfig[type]
  const Icon = icon || config.DefaultIcon

  return (
    <div
      className={cn(
        "p-4 border-4 rounded",
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("w-5 h-5 flex-shrink-0", config.text)} />
        <p className={cn("font-bold", config.text)}>{message}</p>
      </div>
    </div>
  )
}
