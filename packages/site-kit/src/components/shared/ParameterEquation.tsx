"use client"

import React from "react"
import { Latex } from "@optimitron/neobrutalist-ui/ui/latex"
import type { Parameter } from "@optimitron/data/parameters"
import { cn } from "@optimitron/neobrutalist-ui/cn"

export interface ParameterEquationProps {
  /** The parameter object containing latex or formula */
  param: Parameter
  /** Render as block equation (default) or inline */
  block?: boolean
  /** Additional CSS classes */
  className?: string
  /** Show fallback formula as code if no LaTeX available */
  showFallback?: boolean
}

/**
 * Renders a parameter's equation using LaTeX or formula.
 *
 * Priority:
 * 1. param.latex - Renders with KaTeX
 * 2. param.formula - Renders as code (if showFallback is true)
 * 3. null - Returns nothing
 *
 * @example
 * // Block equation with LaTeX
 * <ParameterEquation param={DFDA_ROI_RD_ONLY} />
 *
 * @example
 * // Inline equation
 * <ParameterEquation param={EFFICACY_LAG_REDUCTION} block={false} />
 *
 * @example
 * // With fallback to formula
 * <ParameterEquation
 *   param={SOME_PARAM}
 *   showFallback={true}
 *   className="my-4"
 * />
 */
export function ParameterEquation({
  param,
  block = true,
  className = "",
  showFallback = true,
}: ParameterEquationProps) {
  // Prefer LaTeX if available
  if (param.latex) {
    return <Latex block={block} className={className}>{param.latex}</Latex>
  }

  // Fallback to formula as code
  if (showFallback && param.formula) {
    return (
      <code
        className={cn(
          "bg-muted px-2 py-1 rounded text-sm font-mono",
          block && "block my-2",
          className
        )}
      >
        {param.formula}
      </code>
    )
  }

  return null
}

/**
 * Block equation component (convenience wrapper)
 */
export function ParameterEquationBlock({
  param,
  className = "",
  showFallback = true,
}: Omit<ParameterEquationProps, "block">) {
  return (
    <ParameterEquation
      param={param}
      block={true}
      className={className}
      showFallback={showFallback}
    />
  )
}

/**
 * Inline equation component (convenience wrapper)
 */
export function ParameterEquationInline({
  param,
  className = "",
  showFallback = true,
}: Omit<ParameterEquationProps, "block">) {
  return (
    <ParameterEquation
      param={param}
      block={false}
      className={className}
      showFallback={showFallback}
    />
  )
}
