"use client"

import { useEffect } from "react"
import { InlineMath, BlockMath } from 'react-katex'

// Dynamic import keeps the CSS off the module top so Node-side render scripts
// don't crash trying to parse a `.css` file. Loads once on first client render.
let katexCssLoaded = false
function useEnsureKatexStyles() {
  useEffect(() => {
    if (katexCssLoaded) return
    katexCssLoaded = true
    // @ts-expect-error — bundler-only side-effect import.
    void import("katex/dist/katex.min.css")
  }, [])
}

interface LatexProps {
  children: string
  block?: boolean
  className?: string
}

/**
 * KaTeX safety, checked 2026-08-08 and recorded so it is not re-litigated.
 *
 * react-katex@3.1.0 hardcodes its KaTeX options to {displayMode, errorColor,
 * throwOnError} and exposes no `settings` prop, so `trust` stays at KaTeX's
 * default of false and cannot be raised from here. That default is the control
 * that refuses \href, \url and the \html* commands -- the only KaTeX inputs
 * that can emit markup or a URL.
 *
 * This matters because task impact estimates now accept an agent-written
 * `formulaLatex`. Today nothing renders it through this component (the impact
 * trace prints it as escaped text in a <code> block), but if that changes,
 * re-check `trust` before upgrading or replacing react-katex -- a version with
 * a settings pass-through would make it reachable.
 */

export function Latex({ children, block = false, className = '' }: LatexProps) {
  useEnsureKatexStyles()
  if (block) {
    return (
      <div className={`my-4 w-full max-w-full overflow-x-auto ${className}`}>
        <div className="latex-block-wrapper">
          <BlockMath math={children} />
        </div>
        <style jsx global>{`
          .latex-block-wrapper .katex-display {
            font-size: 0.75em;
            margin: 0;
          }
          @media (max-width: 768px) {
            .latex-block-wrapper .katex-display {
              font-size: 0.6em;
            }
          }
          @media (max-width: 640px) {
            .latex-block-wrapper .katex-display {
              font-size: 0.5em;
            }
          }
        `}</style>
      </div>
    )
  }
  return (
    <span className="latex-inline-wrapper">
      <InlineMath math={children} />
      <style jsx global>{`
        .latex-inline-wrapper .katex {
          font-size: 1em;
        }
        @media (max-width: 640px) {
          .latex-inline-wrapper .katex {
            font-size: 0.95em;
          }
        }
      `}</style>
    </span>
  )
}

export function LatexBlock({ children, className = '' }: { children: string; className?: string }) {
  return <Latex block className={className}>{children}</Latex>
}

export function LatexInline({ children }: { children: string }) {
  return <Latex>{children}</Latex>
}
