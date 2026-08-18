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
