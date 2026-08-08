import TreatyVoteSection from "@/components/landing/treaty-vote-section"

export const dynamic = "force-dynamic"

type EmbedPageProps = {
  searchParams?: { ref?: string; embed?: string }
}

/**
 * Framed survey surface for partners (iframe / embed.js).
 * Referral: ?ref=CODE
 */
export default function EmbedPage({ searchParams }: EmbedPageProps) {
  const ref = searchParams?.ref

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4" data-embed="1" data-ref={ref ?? ""}>
      <TreatyVoteSection postVoteMode="lite" />
      {ref ? <p className="sr-only">Referral code {ref}</p> : null}
    </div>
  )
}
