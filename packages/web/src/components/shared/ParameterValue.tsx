"use client"

import React, { useState } from "react"
import { Dialog } from "@/components/retroui/Dialog"
import { Badge } from "@/components/retroui/Badge"
import { ExternalLink, FlaskConical, BookOpen, X, type LucideIcon } from "lucide-react"
import {
  fmtParam,
  fmtParamValueOnly,
  citations,
  type Parameter,
  type Citation,
} from "@optimitron/data/parameters"
import { Latex } from "@/components/ui/latex"
import { cn } from "@/lib/utils"

export interface ParameterValueProps {
  /** The parameter object to display */
  param: Parameter
  /** How to display the value (default "auto")
   *  - "auto": value only, no unit suffix (fmtParamValueOnly)
   *  - "integer": Math.round(value), no suffixes
   *  - "withUnit": full formatted value with unit (fmtParam)
   */
  display?: "auto" | "integer" | "withUnit"
  /** Significant figures (default 3) */
  figures?: number
  /** Show popover with metadata on hover (default: true) */
  showPopover?: boolean
  /** Additional CSS classes for the value */
  className?: string
  /**
   * Override the rendered text (popover metadata still uses `param`). Useful
   * when the displayed value is derived from `param` but needs custom
   * formatting the auto-formatter can't express — e.g., a percentage
   * computed from a ratio with a fixed decimal count.
   */
  valueOverride?: string
}

export function ParameterValue({
  param,
  display = "auto",
  figures = 3,
  showPopover = true,
  className,
  valueOverride,
}: ParameterValueProps) {
  const [open, setOpen] = useState(false)

  const text = valueOverride ?? (() => {
    switch (display) {
      case "integer":
        return String(Math.round(param.value))
      case "withUnit":
        return fmtParam(param, figures)
      default:
        return fmtParamValueOnly(param, figures)
    }
  })()
  const citation: Citation | undefined = param.sourceRef
    ? citations[param.sourceRef]
    : undefined

  const hasMetadata = [
    param.displayName,
    param.description,
    param.formula,
    param.latex,
    citation?.title,
    param.confidence,
    param.calculationsUrl,
    param.manualPageUrl,
    param.peerReviewed,
    param.conservative,
    param.confidenceInterval,
  ].some(Boolean)

  if (!showPopover || !hasMetadata) {
    return <span className={className}>{text}</span>
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            "cursor-help underline decoration-dotted underline-offset-2 decoration-foreground/30 inline text-left",
            className
          )}
        >
          {text}
        </button>
      </Dialog.Trigger>
      <Dialog.Content
        size="screen"
        className="!w-[95vw] !max-w-[900px] max-h-[90vh] !grid-cols-[minmax(0,1fr)] overflow-hidden border-2 border-foreground bg-background shadow-none"
      >
        <div className="flex min-w-0 items-start justify-between gap-4 border-b-2 border-foreground bg-foreground px-4 py-3 text-background">
          <h2 className="min-w-0 flex-1 break-words text-base font-black uppercase leading-tight">
            {param.displayName ?? "Parameter Details"}
          </h2>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="shrink-0 border-2 border-background p-1 hover:bg-background/10"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </div>
        <div className="min-w-0 p-4 max-h-[calc(90vh-56px)] overflow-auto">
          <div className="min-w-0 w-full max-w-full space-y-4">
            <ParameterDetailContent param={param} />
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}

function ParameterDetailContent({
  param,
}: {
  param: Parameter
}) {
  const citation: Citation | undefined = param.sourceRef
    ? citations[param.sourceRef]
    : undefined

  const fullValue = fmtParam(param)
  const hasReferenceActions = Boolean(
    param.calculationsUrl ||
    param.manualPageUrl
  )
  const hasCitationDetail = Boolean(citation?.title)

  return (
    <div className="min-w-0 space-y-3">
      {/* Value + unit prominently displayed */}
      <div className="text-2xl font-black break-words">{fullValue}</div>

      {param.description && (
        <p className="text-sm font-bold leading-relaxed text-muted-foreground break-words">
          {param.description}
        </p>
      )}

      {/* Confidence interval — plain English */}
      {param.confidenceInterval && (
        <ConfidenceIntervalBlock param={param} />
      )}

      {param.latex ? (
        <div className="min-w-0 max-w-full overflow-x-auto border-2 border-foreground bg-background p-3">
          <Latex block>{param.latex}</Latex>
        </div>
      ) : param.formula ? (
        <div className="text-sm break-words">
          <span className="font-bold">Formula: </span>
          <code className="border border-foreground bg-background px-1.5 py-0.5 text-xs break-all">
            {param.formula}
          </code>
        </div>
      ) : null}

      {/* Badges row */}
      {param.peerReviewed || param.conservative ? (
        <div className="flex flex-wrap items-center gap-2">
          {param.peerReviewed && (
            <Badge
              variant="outline"
              className="h-5 border-foreground bg-background px-1.5 py-0 text-[10px] font-bold uppercase text-foreground"
            >
              peer-reviewed
            </Badge>
          )}
          {param.conservative && (
            <Badge
              variant="outline"
              className="h-5 border-foreground bg-background px-1.5 py-0 text-[10px] font-bold uppercase text-foreground"
            >
              conservative estimate
            </Badge>
          )}
        </div>
      ) : null}

      {(hasReferenceActions || hasCitationDetail) && (
        <div className="space-y-3 border-t border-foreground pt-3">
          {hasReferenceActions && (
            <div className="flex flex-wrap items-center gap-2">
              {param.calculationsUrl && (
                <MetaLink
                  href={param.calculationsUrl}
                  icon={FlaskConical}
                  label="Simulations & Sensitivity"
                />
              )}
              {param.manualPageUrl && (
                <MetaLink
                  href={param.manualPageUrl}
                  icon={BookOpen}
                  label="Chapter"
                  detail={param.manualPageTitle ?? "Manual"}
                />
              )}
            </div>
          )}

          {citation?.title && (
            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
              {citation.title}
              {citation.author?.[0] && (
                <span>
                  {" — "}
                  {citation.author[0].literal ??
                    `${citation.author[0].family ?? ""}${citation.author[0].given ? `, ${citation.author[0].given}` : ""}`}
                  {citation.author.length > 1 && " et al."}
                </span>
              )}
              {citation.issued?.["date-parts"]?.[0]?.[0] && (
                <span> ({citation.issued["date-parts"][0][0]})</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ConfidenceIntervalBlock({ param }: { param: Parameter }) {
  if (!param.confidenceInterval) return null

  const [low, high] = param.confidenceInterval
  const lowFmt = fmtParam({ ...param, value: low })
  const highFmt = fmtParam({ ...param, value: high })

  return (
    <div className="border-2 border-foreground bg-background p-3 text-sm">
      <div className="font-black uppercase text-xs tracking-wider mb-1">
        Estimated Range
      </div>
      <p className="font-bold text-muted-foreground">
        The true value likely falls between{" "}
        <span className="text-foreground">{lowFmt}</span>
        {" "}and{" "}
        <span className="text-foreground">{highFmt}</span>
        <span className="text-xs"> (95% confidence)</span>
      </p>
    </div>
  )
}

function MetaLink({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string
  icon: LucideIcon
  label: string
  detail?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex max-w-full items-center gap-1.5 border-2 border-foreground bg-background px-2 py-1 text-[10px] leading-tight text-foreground hover:bg-foreground hover:text-background"
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="font-black uppercase tracking-wide">{label}</span>
      {detail && (
        <span className="min-w-0 truncate font-semibold normal-case">
          {detail}
        </span>
      )}
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  )
}
