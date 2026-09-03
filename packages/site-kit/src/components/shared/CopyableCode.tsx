"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@optimitron/neobrutalist-ui/cn"
import { copyTextToClipboard } from "../../lib/clipboard"

interface CopyableCodeProps {
  className?: string
  /** The exact value a developer is meant to paste somewhere else. */
  code: string
}

/**
 * A code block with a copy button.
 *
 * Every value on the developer pages — the MCP server URL, the `claude mcp add`
 * command, the JSON config block, an endpoint — is something the reader has to
 * reproduce byte-for-byte in a terminal, a config file, or another site's form.
 * Selecting a wrapped multi-line value by hand is where the typos come from.
 */
export function CopyableCode({ className, code }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<number>()

  // Clearing the pending timer before starting a new one keeps the
  // confirmation visible for a full two seconds after the *latest* copy.
  // Without it, copying twice in quick succession lets the first timer clear
  // the badge while the second copy still looks unacknowledged. The unmount
  // cleanup stops the same timer from setting state on a gone component.
  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  async function handleCopy() {
    try {
      await copyTextToClipboard(code)
      setCopied(true)
      window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable; the text is still selectable.
    }
  }

  return (
    <div className={cn("min-w-0 max-w-full overflow-hidden", className)}>
      <div className="flex justify-end border-b border-foreground/30 p-2">
        <button
          aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
          className="inline-flex items-center gap-1 border-2 border-foreground bg-background px-2 py-1 text-xs font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
          onClick={() => void handleCopy()}
          type="button"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words p-4 text-sm font-bold">
        <code>{code}</code>
      </pre>
    </div>
  )
}
