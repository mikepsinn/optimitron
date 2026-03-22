import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import Link from "next/link"
import { PRIZE_POOL_HORIZON_MULTIPLE } from "@/lib/parameters-calculations-citations"
import { fmtParam } from "@/lib/format-parameter"

export default function ActionOptionsSection() {
  const options = [
    {
      option: "OPTION 1: LEARN",
      action: "READ THE EVIDENCE",
      description: "Peer-reviewed papers. Real math. No ideology.",
      color: "bg-brutal-yellow",
      textColor: "text-brutal-yellow-foreground",
      accentColor: "text-brutal-pink",
      href: "/research" as string | null,
    },
    {
      option: "OPTION 2: VOTE",
      action: "RANK YOUR PRIORITIES",
      description: "30 seconds. Anonymous. Shape optimal policy.",
      color: "bg-brutal-cyan",
      textColor: "text-brutal-cyan-foreground",
      accentColor: "text-brutal-pink",
      href: "/wishocracy" as string | null,
    },
    {
      option: "OPTION 3: FUND",
      action: "BACK THE PRIZE",
      description: `Zero-downside pool. Get ${fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} yield if it fails. Play the game.`,
      color: "bg-background",
      textColor: "text-foreground",
      accentColor: "text-brutal-pink",
      href: "/prize" as string | null,
    },
    {
      option: "OPTION 4: DO NOTHING",
      action: "WATCH GOVERNMENTS FLAIL",
      description: "And continue paying $101 trillion per year for governance that doesn't optimize anything.",
      color: "bg-primary",
      textColor: "text-primary-foreground",
      accentColor: "text-brutal-pink",
      href: null as string | null,
    },
  ]

  return (
    <SectionContainer bgColor="foreground" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-center mb-16 text-brutal-pink-foreground">
          DO <span className="text-primary">SOMETHING</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {options.map((item, index) => {
            const cardContent = (
              <Card
                key={index}
                className={`${item.color} border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-2 hover:translate-y-2 transition-transform h-full flex flex-col ${item.href ? "cursor-pointer" : ""}`}
              >
                <div className={`text-base sm:text-lg font-black mb-3 uppercase ${item.textColor}`}>{item.option}</div>
                <div className={`text-lg sm:text-xl font-black mb-3 uppercase ${item.accentColor}`}>{item.action}</div>
                <div className={`font-bold text-sm ${item.textColor}`}>{item.description}</div>
              </Card>
            )

            return item.href ? (
              <Link key={index} href={item.href} className="h-full">
                {cardContent}
              </Link>
            ) : (
              cardContent
            )
          })}
        </div>
      </Container>
    </SectionContainer>
  )
}
