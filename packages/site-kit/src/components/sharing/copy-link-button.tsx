"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { cn } from "@optimitron/neobrutalist-ui/cn"
import { trackCopyLink } from "../../lib/analytics"

interface CopyLinkButtonProps {
  link: string
  variant?: "default" | "dashboard" | "landing" | "share"
  className?: string
  label?: string
  copiedLabel?: string
  contentType?: string
}

export function CopyLinkButton({
  link,
  variant = "default",
  className,
  label = "COPY REFERRAL LINK",
  copiedLabel = "LINK COPIED!",
  contentType = "referral_link",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      trackCopyLink({
        contentType,
        url: link,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Landing page variant - full width, large, uppercase
  if (variant === "landing") {
    return (
      <Button
        onClick={handleCopy}
        className={cn(
          "w-full h-14 text-lg font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2",
          className,
        )}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            {copiedLabel}
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            {label}
          </>
        )}
      </Button>
    )
  }

  // Dashboard variant - icon button, compact
  if (variant === "dashboard") {
    return (
      <Button
        onClick={handleCopy}
        className={cn(
          "border-2 border-primary bg-brutal-cyan hover:bg-brutal-cyan/90 shrink-0",
          className,
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    )
  }

  // Share row variant - visually matches social platform buttons
  if (variant === "share") {
    return (
      <Button
        onClick={handleCopy}
        className={cn(
          "border-2 border-primary bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground shrink-0",
          className,
        )}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            {copiedLabel}
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            {label}
          </>
        )}
      </Button>
    )
  }

  // Default variant
  return (
    <Button onClick={handleCopy} className={className}>
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </>
      )}
    </Button>
  )
}

