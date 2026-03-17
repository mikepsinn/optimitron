"use client"

import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface LatexProps {
  children: string
  block?: boolean
  className?: string
}

export function Latex({ children, block = false, className = '' }: LatexProps) {
  if (block) {
    return (
      <div className={`my-4 overflow-x-auto ${className}`}>
        <div className="inline-block min-w-full latex-block-wrapper">
          <BlockMath math={children} />
        </div>
        <style jsx global>{`
          .latex-block-wrapper .katex-display {
            font-size: 1.1em;
          }
          @media (max-width: 768px) {
            .latex-block-wrapper .katex-display {
              font-size: 0.85em;
            }
          }
          @media (max-width: 640px) {
            .latex-block-wrapper .katex-display {
              font-size: 0.75em;
            }
          }
          @media (max-width: 480px) {
            .latex-block-wrapper .katex-display {
              font-size: 0.65em;
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
