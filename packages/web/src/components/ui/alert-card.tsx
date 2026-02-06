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
    bg: "bg-red-100",
    border: "border-red-500",
    text: "text-red-700",
    DefaultIcon: AlertCircle,
  },
  success: {
    bg: "bg-green-100",
    border: "border-green-500",
    text: "text-green-700",
    DefaultIcon: CheckCircle,
  },
  warning: {
    bg: "bg-yellow-100",
    border: "border-yellow-500",
    text: "text-yellow-700",
    DefaultIcon: AlertTriangle,
  },
  info: {
    bg: "bg-blue-100",
    border: "border-blue-500",
    text: "text-blue-700",
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
