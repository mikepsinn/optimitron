import { Card } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import type { GeneralResearchCitation } from "@/types/general-research-citation"

interface GeneralResearchCitationCardProps {
  citation: GeneralResearchCitation
  className?: string
  variant?: "featured" | "detailed"
}

export function GeneralResearchCitationCard({
  citation,
  className,
  variant = "detailed",
}: GeneralResearchCitationCardProps) {
  const firstSource = citation.sources[0]
  const firstQuote = citation.quotes[0]

  if (variant === "featured") {
    // Research page style - clean, scannable, action-oriented
    return (
      <Card
        id={citation.id}
        className={`p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background ${className || ""}`}
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-black uppercase mb-2">{citation.title}</h3>
            {firstSource && (
              <div className="text-sm font-bold text-brutal-pink mb-4">{firstSource.text}</div>
            )}
          </div>
          {firstSource && (
            <a
              href={firstSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground px-6 py-3 text-sm font-black uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all whitespace-nowrap"
            >
              VIEW SOURCE
            </a>
          )}
        </div>
        {firstQuote && <p className="text-lg mb-4 leading-relaxed">{firstQuote}</p>}
        {citation.notes && (
          <div className="bg-brutal-yellow/20 border-l-4 border-brutal-yellow p-4">
            <div className="text-sm font-bold uppercase mb-1">IMPACT</div>
            <div className="font-bold">{citation.notes}</div>
          </div>
        )}
      </Card>
    )
  }

  // Detailed variant - for References page with all sources and quotes
  return (
    <Card
      id={citation.id}
      className={`p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${className || ""}`}
    >
      <h3 className="text-xl md:text-2xl font-black uppercase mb-4">{citation.title}</h3>

      {citation.quotes.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-bold uppercase text-muted-foreground mb-2">Quotes</div>
          <div className="space-y-3 pl-4 border-l-4 border-primary">
            {citation.quotes.map((quote, quoteIndex) => (
              <p key={quoteIndex} className="text-base leading-relaxed">
                &ldquo;{quote}&rdquo;
              </p>
            ))}
          </div>
        </div>
      )}

      {citation.sources.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-bold uppercase text-muted-foreground mb-2">Sources</div>
          <ul className="space-y-2">
            {citation.sources.map((source, sourceIndex) => (
              <li key={sourceIndex}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brutal-pink hover:underline font-bold flex items-center gap-1 break-words"
                >
                  {source.text}
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {citation.notes && (
        <div className="bg-brutal-yellow/20 border-l-4 border-brutal-yellow p-4">
          <div className="text-sm font-bold uppercase mb-1">NOTES</div>
          <div className="font-bold">{citation.notes}</div>
        </div>
      )}
    </Card>
  )
}
