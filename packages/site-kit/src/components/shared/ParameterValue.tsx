"use client"

import React from "react"
import { Badge } from "@optimitron/neobrutalist-ui/ui/badge"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@optimitron/neobrutalist-ui/ui/dialog"
import { Latex } from "@optimitron/neobrutalist-ui/ui/latex"
import { cn } from "@optimitron/neobrutalist-ui/cn"
import {
  citations,
  type Citation,
  type Parameter,
} from "@optimitron/data/parameters"
import {
  formatParameter,
  type FormatParameterOptions,
} from "@optimitron/data/parameters/compact-format"
import { BookOpen, ExternalLink, FlaskConical, Info, type LucideIcon } from "lucide-react"

export interface ParameterValueProps {
  /** The parameter object to display */
  param: Parameter
  /** Existing local formatting API */
  format?: FormatParameterOptions
  /** Compatibility with the external component */
  display?: "auto" | "integer" | "withUnit"
  /** Compatibility with the external component */
  figures?: number
  /** When false, render plain text with no modal */
  showPopover?: boolean
  /**
   * Campaign-page shorthand for `showPopover`. The pages migrated out of
   * Optimitron express "plain text, no modal" as `presentation="inline"`, so
   * both spellings are accepted. `showPopover` wins when a caller sets both;
   * `presentation` alone is enough to suppress the modal.
   */
  presentation?: "interactive" | "inline"
  /** Additional CSS classes for the rendered value */
  className?: string
  /** Render as inline span or block div when modal is disabled */
  as?: "span" | "div"
  /**
   * Replace the rendered text while keeping `param` as the source for the
   * detail modal. Needed where the displayed figure is derived from the
   * parameter but the auto-formatter cannot express it — a percentage computed
   * from a ratio at a fixed decimal count, for example. The modal still shows
   * the parameter's own full value, so the override never edits the underlying
   * number, only how this one call site prints it.
   */
  valueOverride?: string
}

export function ParameterValue({
  param,
  format,
  display = "auto",
  figures = 3,
  showPopover,
  presentation,
  className,
  as: Component = "span",
  valueOverride,
}: ParameterValueProps) {
  const [open, setOpen] = React.useState(false)

  const popoverEnabled = showPopover ?? presentation !== "inline"

  const resolvedFormat = resolveFormatOptions(param, format, display, figures)
  const text =
    valueOverride ??
    (display === "integer"
      ? String(Math.round(param.value))
      : formatParameter(param, resolvedFormat))
  // Copy-preview snapshots turn this into a markdown link so source-backed
  // values keep their source (see scripts/lib/copy-preview-dom.ts).
  // sourceUrl comes last: the dialog below renders it as the original source,
  // so a parameter carrying only that would otherwise lose its citation in the
  // copy preview while still showing one on screen. Ordering it after the other
  // two keeps the preferred links preferred, and the trailing ?? undefined
  // keeps an absent sourceUrl from publishing "(undefined)" as an href.
  const referenceUrl =
    param.manualPageUrl ?? param.calculationsUrl ?? param.sourceUrl ?? undefined

  const hasMetadata = [
    param.displayName,
    param.description,
    param.formula,
    param.latex,
    param.sourceRef,
    param.sourceUrl,
    param.confidence,
    param.calculationsUrl,
    param.manualPageUrl,
    param.peerReviewed,
    param.conservative,
    param.confidenceInterval,
  ].some(Boolean)

  if (!popoverEnabled || !hasMetadata) {
    return (
      <Component className={className} data-copy-preview-href={referenceUrl}>
        {text}
      </Component>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-copy-preview-href={referenceUrl}
          className={cn(
            "inline cursor-help text-left underline decoration-dotted decoration-foreground/30 underline-offset-2",
            className
          )}
        >
          {text}
        </button>
      </DialogTrigger>
      <DialogContent className="!w-[95vw] !max-w-[900px] max-h-[90vh] gap-0 overflow-hidden border-4 border-primary p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="border-b-4 border-primary bg-primary px-4 py-3 pr-12 text-primary-foreground">
          <DialogTitle className="truncate text-base font-black uppercase leading-tight">
            {param.displayName ?? param.parameterName ?? "Parameter Details"}
          </DialogTitle>
        </div>
        <div className="max-h-[calc(90vh-56px)] overflow-auto p-4">
          <div className="min-w-0 w-full max-w-full space-y-4">
            <ParameterDetailContent param={param} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ParameterDetailContent({ param }: { param: Parameter }) {
  const citation: Citation | undefined = param.sourceRef ? citations[param.sourceRef] : undefined
  const fullValue = formatParameter(param, { includeUnit: true })

  return (
    <div className="min-w-0 space-y-3">
      <div className="text-2xl font-black break-words">{fullValue}</div>

      {param.description && (
        <p className="text-sm font-bold leading-relaxed text-muted-foreground break-words">
          {param.description}
        </p>
      )}

      {param.confidenceInterval && <ConfidenceIntervalBlock param={param} />}

      {param.latex ? (
        <div className="min-w-0 max-w-full overflow-x-auto border-2 border-primary bg-muted p-3">
          <Latex block>{param.latex}</Latex>
        </div>
      ) : param.formula ? (
        <div className="text-sm break-words">
          <span className="font-bold">Formula: </span>
          <code className="rounded-none border-2 border-primary bg-muted px-1.5 py-0.5 text-xs break-all">
            {param.formula}
          </code>
        </div>
      ) : null}

      {(param.peerReviewed || param.conservative || param.confidence) && (
        <div className="flex flex-wrap items-center gap-2">
          {param.peerReviewed && (
            <Badge
              variant="outline"
              className="h-5 border-primary bg-brutal-cyan px-1.5 py-0 text-[10px] font-bold uppercase text-brutal-cyan-foreground"
            >
              peer-reviewed
            </Badge>
          )}
          {param.conservative && (
            <Badge
              variant="outline"
              className="h-5 border-primary bg-brutal-green px-1.5 py-0 text-[10px] font-bold uppercase text-brutal-green-foreground"
            >
              conservative estimate
            </Badge>
          )}
          {param.confidence && (
            <Badge
              variant="outline"
              className="h-5 border-primary bg-background px-1.5 py-0 text-[10px] font-bold uppercase"
            >
              {param.confidence}
            </Badge>
          )}
        </div>
      )}

      <div className="space-y-3 border-t-2 border-primary/20 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          {param.sourceUrl && (
            <MetaLink
              href={param.sourceUrl}
              icon={ExternalLink}
              accent="pink"
              label="Original Source"
            />
          )}
          {citation?.URL && citation.URL !== param.sourceUrl && (
            <MetaLink
              href={citation.URL}
              icon={ExternalLink}
              accent="pink"
              label="Published Study"
            />
          )}
          {!param.sourceUrl && !citation?.URL && param.sourceRef && (
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Ref: {param.sourceRef.replace(/-/g, " ")}
            </span>
          )}
          {param.calculationsUrl && (
            <MetaLink
              href={param.calculationsUrl}
              icon={FlaskConical}
              accent="cyan"
              label="Simulations & Sensitivity"
            />
          )}
          {param.manualPageUrl && (
            <MetaLink
              href={param.manualPageUrl}
              icon={BookOpen}
              accent="yellow"
              label="Chapter"
              detail={param.manualPageTitle ?? "Manual"}
            />
          )}
        </div>

        {citation?.title && (
          <p className="text-xs font-bold leading-relaxed text-muted-foreground">
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
    </div>
  )
}

function ConfidenceIntervalBlock({ param }: { param: Parameter }) {
  if (!param.confidenceInterval) return null

  const [low, high] = param.confidenceInterval
  const lowFmt = formatParameter({ ...param, value: low }, { includeUnit: true })
  const highFmt = formatParameter({ ...param, value: high }, { includeUnit: true })

  return (
    <div className="border-2 border-primary/20 bg-muted p-3 text-sm">
      <div className="mb-1 text-xs font-black uppercase tracking-wider">Estimated Range</div>
      <p className="font-bold text-muted-foreground">
        The true value likely falls between <span className="text-foreground">{lowFmt}</span> and{" "}
        <span className="text-foreground">{highFmt}</span>
        <span className="text-xs"> (95% confidence)</span>
      </p>
    </div>
  )
}

function MetaLink({
  href,
  icon: Icon,
  accent,
  label,
  detail,
}: {
  href: string
  icon: LucideIcon
  accent: "cyan" | "yellow" | "pink"
  label: string
  detail?: string
}) {
  const accentClasses = {
    cyan: "bg-brutal-cyan text-brutal-cyan-foreground",
    yellow: "bg-brutal-yellow text-brutal-yellow-foreground",
    pink: "bg-brutal-pink text-brutal-pink-foreground",
  }[accent]

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 border-2 border-primary px-2 py-1 text-[10px] leading-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-px hover:translate-y-px hover:shadow-none",
        accentClasses
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="font-black uppercase tracking-wide">{label}</span>
      {detail && <span className="min-w-0 truncate font-semibold normal-case">{detail}</span>}
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  )
}

function resolveFormatOptions(
  param: Parameter,
  format: FormatParameterOptions | undefined,
  display: ParameterValueProps["display"],
  figures: number
): FormatParameterOptions {
  const resolved: FormatParameterOptions = { ...(format ?? {}) }

  if (display === "withUnit") {
    resolved.includeUnit = true
  }

  if (resolved.precision === undefined && Number.isFinite(figures)) {
    resolved.precision = precisionFromFigures(param.value, figures)
  }

  return resolved
}

function precisionFromFigures(value: number, figures: number): number {
  if (!Number.isFinite(value) || value === 0) {
    return Math.max(figures - 1, 0)
  }

  const digits = Math.floor(Math.log10(Math.abs(value))) + 1
  return Math.max(figures - digits, 0)
}

export function ParameterInline({
  param,
  format,
  display,
  figures,
  className,
  valueOverride,
}: Omit<ParameterValueProps, "showPopover" | "as">) {
  const resolvedFormat = resolveFormatOptions(param, format, display, figures ?? 3)
  const text =
    valueOverride ??
    (display === "integer"
      ? String(Math.round(param.value))
      : formatParameter(param, resolvedFormat))

  return <span className={className}>{text}</span>
}
