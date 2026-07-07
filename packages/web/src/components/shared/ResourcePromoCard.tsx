import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { PODCAST_URLS, MANUAL_URLS, withUtm } from "@/lib/resource-links"

interface ResourcePromoCardProps {
  utmSource: string
  showDescription?: boolean
  description?: string
  variant?: "compact" | "card"
}

export function ResourcePromoCard({
  utmSource,
  showDescription = true,
  description,
  variant = "card",
}: ResourcePromoCardProps) {
  const descText = description ??
    "An alien who finds your species confusing wrote a 300-page field manual covering the economics, legal framework, financial architecture, and the complete 36-month roadmap."

  const buttons = (
    <div className="grid grid-cols-3 gap-3">
      <a
        href={withUtm(PODCAST_URLS.spotify, utmSource)}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-background text-foreground border-4 border-primary p-3 font-black text-xs sm:text-sm uppercase text-center shadow-none transition-colors hover:bg-foreground hover:text-background flex items-center justify-center gap-1"
      >
        Listen Free
        <ExternalLink className="w-3 h-3 stroke-[3px] hidden sm:block" />
      </a>
      <a
        href={withUtm(MANUAL_URLS.paperback, utmSource)}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-background text-foreground border-4 border-primary p-3 font-black text-xs sm:text-sm uppercase text-center shadow-none transition-colors hover:bg-foreground hover:text-background flex items-center justify-center gap-1"
      >
        Paperback
        <ExternalLink className="w-3 h-3 stroke-[3px] hidden sm:block" />
      </a>
      <Link
        href={MANUAL_URLS.readOnline}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-background text-foreground border-4 border-primary p-3 font-black text-xs sm:text-sm uppercase text-center shadow-none transition-colors hover:bg-foreground hover:text-background flex items-center justify-center"
      >
        Read Free
      </Link>
    </div>
  )

  if (variant === "compact") {
    return (
      <div>
        {showDescription && (
          <p className="text-center font-bold text-sm text-muted-foreground mb-4">
            {descText}
          </p>
        )}
        {buttons}
      </div>
    )
  }

  return (
    <div className="border-4 border-primary bg-background p-6 sm:p-8 shadow-none">
      {showDescription && (
        <>
          <p className="text-center font-black uppercase text-lg sm:text-xl mb-2">
            Want the full story?
          </p>
          <p className="text-center font-bold text-sm text-muted-foreground mb-6">
            {descText}
          </p>
        </>
      )}
      {buttons}
    </div>
  )
}
