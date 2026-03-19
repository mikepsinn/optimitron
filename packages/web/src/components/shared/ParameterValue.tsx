"use client"

import React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Info } from "lucide-react"
import type { Parameter } from "@/lib/parameters-calculations-citations"
import {
  formatParameter,
  formatConfidenceInterval,
  type FormatParameterOptions,
} from "@/lib/format-parameter"
import { cn } from "@/lib/utils"

export interface ParameterValueProps {
  /** The parameter object to display */
  param: Parameter
  /** Format options */
  format?: FormatParameterOptions
  /** Show popover with metadata on hover (default: true) */
  showPopover?: boolean
  /** Additional CSS classes for the value */
  className?: string
  /** Render as inline span (default) or block div */
  as?: "span" | "div"
}

export function ParameterValue({
  param,
  format = {},
  showPopover = true,
  className,
  as: Component = "span",
}: ParameterValueProps) {
  const formattedValue = formatParameter(param, format)

  if (!showPopover) {
    return <Component className={className}>{formattedValue}</Component>
  }

  const confidenceInterval = formatConfidenceInterval(param)
  const hasMetadata =
    param.displayName ||
    param.description ||
    param.formula ||
    param.sourceRef ||
    param.confidence ||
    confidenceInterval

  if (!hasMetadata) {
    return <Component className={className}>{formattedValue}</Component>
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Component
            className={cn(
              "cursor-help underline decoration-dotted underline-offset-2 decoration-foreground/30",
              className
            )}
          >
            {formattedValue}
          </Component>
        </TooltipTrigger>
        <TooltipContent
          className="max-w-sm bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          sideOffset={8}
        >
          <ParameterTooltipContent param={param} confidenceInterval={confidenceInterval} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ParameterTooltipContent({
  param,
  confidenceInterval,
}: {
  param: Parameter
  confidenceInterval: string | null
}) {
  return (
    <div className="space-y-2">
      {param.displayName && (
        <div className="font-black text-sm">{param.displayName}</div>
      )}

      {param.description && (
        <p className="text-xs text-muted-foreground">{param.description}</p>
      )}

      {confidenceInterval && (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold">95% CI:</span>
          <span className="font-mono">{confidenceInterval}</span>
        </div>
      )}

      {param.formula && (
        <div className="text-xs">
          <span className="font-bold">Formula: </span>
          <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
            {param.formula}
          </code>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-primary/20">
        {param.confidence && (
          <ConfidenceBadge confidence={param.confidence} />
        )}

        {param.sourceRef && (
          <SourceLink sourceRef={param.sourceRef} />
        )}
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colorMap: Record<string, string> = {
    high: "bg-brutal-green text-brutal-green-foreground",
    medium: "bg-brutal-yellow text-brutal-yellow-foreground",
    low: "bg-brutal-red text-brutal-red-foreground",
    estimated: "bg-muted text-muted-foreground",
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0 h-5 font-bold uppercase border-primary",
        colorMap[confidence] || "bg-muted"
      )}
    >
      {confidence}
    </Badge>
  )
}

function SourceLink({ sourceRef }: { sourceRef: string }) {
  const isUrl = sourceRef.startsWith("http")

  if (isUrl) {
    return (
      <a
        href={sourceRef}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-primary hover:underline flex items-center gap-1"
      >
        <ExternalLink className="h-3 w-3" />
        Source
      </a>
    )
  }

  return (
    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
      <Info className="h-3 w-3" />
      {sourceRef}
    </span>
  )
}

export function ParameterInline({
  param,
  format = {},
  className,
}: Omit<ParameterValueProps, "showPopover" | "as">) {
  return (
    <span className={className}>{formatParameter(param, format)}</span>
  )
}
