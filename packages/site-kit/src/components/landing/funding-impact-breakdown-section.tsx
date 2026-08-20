import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { ImpactExplainer } from "../shared/ImpactExplainer"
import { getSiteConfig } from "../../lib/site-config"
import {
  DFDA_TRIALS_PER_YEAR_CAPACITY,
  DIH_PATIENTS_FUNDABLE_ANNUALLY,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  RARE_DISEASES_COUNT_GLOBAL,
  TREATY_ANNUAL_FUNDING,
} from "@optimitron/data/parameters"
import { formatParameter } from "@optimitron/data/parameters/compact-format"

export default function FundingImpactBreakdownSection() {
  const config = getSiteConfig()
  const showPoliticalContent = config.showPoliticalContent

  // Derived values from parameters
  const trialsPerYear = Math.round(DFDA_TRIALS_PER_YEAR_CAPACITY.value / 1000) // ~41K
  const patientsMillions = Math.round(DIH_PATIENTS_FUNDABLE_ANNUALLY.value / 1e6) // ~23M
  const diseasesUntreatedPct = Math.round((DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value / RARE_DISEASES_COUNT_GLOBAL.value) * 100)
  const fundingFormatted = formatParameter(TREATY_ANNUAL_FUNDING)

  const items = [
    {
      number: `${trialsPerYear}K+`,
      label: "HYPER-EFFICIENT PRAGMATIC TRIALS",
      subtitle: "INTEGRATED INTO STANDARD HEALTHCARE",
      color: "bg-brutal-yellow",
      textColor: "text-brutal-yellow-foreground",
    },
    {
      number: `${patientsMillions}M+`,
      label: "PATIENTS TREATED",
      subtitle: "WITH THE MOST PROMISING NEW THERAPIES",
      color: "bg-brutal-pink",
      textColor: "text-brutal-pink-foreground",
    },
    {
      number: "TREATMENTS",
      label: "FOR EVERY DISEASE",
      subtitle: `${diseasesUntreatedPct}% OF DISEASES HAVE ZERO FDA-APPROVED TREATMENTS`,
      color: "bg-brutal-cyan",
      textColor: "text-brutal-cyan-foreground",
    },
    {
      number: "1%",
      label: showPoliticalContent ? "FEWER BOMBS" : "REDUCTION IN",
      subtitle: showPoliticalContent ? "POINTED AT EVERYONE" : "MILITARY WEAPONS SYSTEMS",
      color: "bg-brutal-yellow",
      textColor: "text-brutal-yellow-foreground",
    },
  ]

  return (
    <SectionContainer bgColor="foreground" borderPosition="bottom" padding="lg" className="text-primary-foreground border-background">
      <Container>
        <div className="flex flex-col items-center gap-4 mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center">
            WHAT <span className="text-primary-foreground">{fundingFormatted}</span> COULD BUY
          </h2>
          <ImpactExplainer className="h-9 w-9 border-primary text-primary bg-foreground text-primary-foreground" label="Show impact math" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {items.map((item, index) => (
            <Card
              key={index}
              className={`${item.color} border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]`}
            >
              <div className={`text-3xl sm:text-4xl md:text-5xl font-black mb-2 ${item.textColor}`}>{item.number}</div>
              <div className={`text-xl sm:text-2xl font-black mb-2 ${item.textColor}`}>{item.label}</div>
              <div className={`font-bold ${item.textColor}`}>{item.subtitle}</div>
            </Card>
          ))}
        </div>
      </Container>
    </SectionContainer>
  )
}
