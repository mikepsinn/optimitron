"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"

type CopyStatus = "idle" | "copied" | "failed"

export function CopyableCode({
  code,
  label = "Copy",
}: {
  code: string
  label?: string
}) {
  const [status, setStatus] = useState<CopyStatus>("idle")

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setStatus("copied")
    } catch {
      setStatus("failed")
    }
    window.setTimeout(() => setStatus("idle"), 2000)
  }

  const buttonLabel =
    status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : label

  return (
    <div className="grid min-w-0 gap-3 border-4 border-black bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <pre className="min-w-0 overflow-x-auto whitespace-pre-wrap break-all px-1 font-mono text-sm font-black leading-6">
        {code}
      </pre>
      <button
        aria-label={buttonLabel}
        className="flex min-h-11 items-center justify-center gap-2 border-4 border-black bg-brutal-cyan px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brutal-pink disabled:cursor-not-allowed disabled:opacity-50"
        onClick={copyCode}
        type="button"
      >
        {status === "copied" ? (
          <Check aria-hidden="true" className="h-4 w-4 stroke-[3px]" />
        ) : (
          <Copy aria-hidden="true" className="h-4 w-4 stroke-[3px]" />
        )}
        <span aria-live="polite">{buttonLabel}</span>
      </button>
    </div>
  )
}
