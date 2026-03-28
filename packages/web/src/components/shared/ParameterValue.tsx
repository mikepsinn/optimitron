"use client"

import React, { useState, useRef, useCallback } from "react"
import { Popover } from "@/components/retroui/Popover"
import { Badge } from "@/components/retroui/Badge"
import { ExternalLink, Info, FlaskConical } from "lucide-react"
import {
  fmtParam,
  fmtParamValueOnly,
  formatConfidenceInterval,
  citations,
  type Parameter,
  type Citation,
} from "@optimitron/data/parameters"
import { Latex } from "@/components/ui/latex"
import { cn } from "@/lib/utils"

export interface ParameterValueProps {
  /** The parameter object to display */
  param: Parameter
  /** Override the formatted string */
  format?: (param: Parameter) => string
  /** Significant figures (default 3) */
  figures?: number
  /** Show the unit from fmtParam (default false — surrounding text usually provides context) */
  showUnit?: boolean
  /** Show popover with metadata on hover (default: true) */
  showPopover?: boolean
  /** Additional CSS classes for the value */
  className?: string
}

export function ParameterValue({
  param,
  format,
  figures = 3,
  showUnit = false,
  showPopover = true,
  className,
}: ParameterValueProps) {
  const [open, setOpen] = useState(false)
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = useCallback(() => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current)
    setOpen(true)
  }, [])

  const handleLeave = useCallback(() => {
    closeTimeout.current = setTimeout(() => setOpen(false), 150)
  }, [])

  const text = format
    ? format(param)
    : showUnit
      ? fmtParam(param, figures)
      : fmtParamValueOnly(param, figures)

  const confidenceInterval = formatConfidenceInterval(param)
  const hasMetadata =
    param.displayName ||
    param.description ||
    param.formula ||
    param.latex ||
    param.sourceRef ||
    param.confidence ||
    param.calculationsUrl ||
    param.peerReviewed ||
    confidenceInterval

  if (!showPopover || !hasMetadata) {
    return <span className={className}>{text}</span>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span onPointerEnter={handleEnter} onPointerLeave={handleLeave}>
        <Popover.Trigger asChild>
          <span
            className={cn(
              "cursor-help underline decoration-dotted underline-offset-2 decoration-foreground/30",
              className
            )}
          >
            {text}
          </span>
        </Popover.Trigger>
      </span>
      <Popover.Content
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        sideOffset={4}
        className="max-w-sm border-4 border-primary bg-background p-4 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <ParameterPopoverContent param={param} confidenceInterval={confidenceInterval} />
      </Popover.Content>
    </Popover>
  )
}

function ParameterPopoverContent({
  param,
  confidenceInterval,
}: {
  param: Parameter
  confidenceInterval: string | null
}) {
  const citation: Citation | undefined = param.sourceRef
    ? citations[param.sourceRef]
    : undefined

  return (
    <div className="space-y-2">
      {param.displayName && (
        <div className="font-black text-sm uppercase tracking-wider">
          {param.displayName}
        </div>
      )}

      {param.description && (
        <p className="text-xs font-bold leading-relaxed text-muted-foreground">
          {param.description}
        </p>
      )}

      {param.latex ? (
        <div className="overflow-x-auto">
          <Latex block>{param.latex}</Latex>
        </div>
      ) : param.formula ? (
        <div className="text-xs">
          <span className="font-bold">Formula: </span>
          <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
            {param.formula}
          </code>
        </div>
      ) : null}

      {confidenceInterval && (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold">95% CI:</span>
          <span className="font-mono">{confidenceInterval}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-primary/20">
        <div className="flex items-center gap-1.5">
          {param.confidence && (
            <ConfidenceBadge confidence={param.confidence} />
          )}
          {param.peerReviewed && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-5 font-bold uppercase border-primary bg-brutal-cyan text-brutal-cyan-foreground"
            >
              peer-reviewed
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {citation?.URL && (
            <a
              href={citation.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-brutal-pink hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              {citation.title ? "Source" : "Source"}
            </a>
          )}
          {!citation?.URL && param.sourceRef && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              {param.sourceRef}
            </span>
          )}
          {param.calculationsUrl && (
            <a
              href={param.calculationsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-brutal-cyan hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <FlaskConical className="h-3 w-3" />
              Calculations
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

const confidenceColorMap: Record<string, string> = {
  high: "bg-brutal-green text-brutal-green-foreground",
  medium: "bg-brutal-yellow text-brutal-yellow-foreground",
  low: "bg-brutal-red text-brutal-red-foreground",
  estimated: "bg-muted text-muted-foreground",
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0 h-5 font-bold uppercase border-primary",
        confidenceColorMap[confidence] || "bg-muted"
      )}
    >
      {confidence}
    </Badge>
  )
}
