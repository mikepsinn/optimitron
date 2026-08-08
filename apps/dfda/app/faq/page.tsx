import Layout from "@/components/layout"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { getSiteConfig } from "@/lib/site-config"
import { formatParameter } from "@/lib/format-parameter"
import {
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT,
  PEACE_DIVIDEND_DIRECT_COSTS,
  PEACE_DIVIDEND_INDIRECT_COSTS,
  GLOBAL_REGISTERED_VOTERS,
  TREATY_ANNUAL_FUNDING,
  DFDA_BENEFIT_RD_ONLY_ANNUAL,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@/lib/parameters-calculations-citations"

export default function FAQPage() {
  const config = getSiteConfig()

  // Fallback FAQ data for variants that haven't configured custom FAQs yet
  const showPoliticalContent = config.showPoliticalContent
  const fallbackFaqs = [
    {
      category: "THE 1% TREATY",
      questions: [
        {
          q: "What is the 1% Treaty?",
          a: "The 1% Treaty is a global agreement where nations redirect just 1% of their military spending to fund pragmatic clinical trials integrated into standard healthcare. This gives everyone 1% more security (fewer nuclear weapons pointed at them) while accelerating access to life-saving treatments by years.",
        },
        {
          q: "Why 1%? Why not more or less?",
          a: `1% is small enough that every nation settles for ${Math.round(NUCLEAR_WINTER_OVERKILL_FACTOR.value) - 1} civilization-ending arsenals instead of ${Math.round(NUCLEAR_WINTER_OVERKILL_FACTOR.value)}. The rest just sit there, being expensive. This should be more than sufficient for any wars you were planning. It is large enough to fund ${formatParameter(DFDA_TRIAL_CAPACITY_MULTIPLIER)} more clinical trials (${formatParameter(TREATY_ANNUAL_FUNDING)} annually), compressing disease eradication from ${formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS)} years to ${formatParameter(DFDA_QUEUE_CLEARANCE_YEARS)}. Everyone also gains 1% more security for free, because every country cuts simultaneously. Your adversaries having 1% fewer weapons pointed at you is a side effect you did not pay extra for.`,
        },
        {
          q: "What happens to military capabilities with 1% less funding?",
          a: "Virtually nothing. Modern militaries have massive redundancy and waste. A 1% reduction is easily absorbed through efficiency improvements, reduced procurement waste, or delayed upgrades. No country loses meaningful defensive capability, but everyone gains health security.",
        },
        {
          q: "Which countries would participate?",
          a: "The treaty is designed for universal participation, but the top 15 military spenders (US, China, Russia, India, Saudi Arabia, UK, Germany, France, Japan, South Korea, Italy, Australia, Canada, Israel, Spain) account for 81% of global military spending. Their participation alone would fund the entire system.",
        },
      ],
    },
    {
      category: "PRAGMATIC TRIALS",
      questions: [
        {
          q: "What are pragmatic trials?",
          a: `Pragmatic trials test treatments in real-world healthcare settings using existing medical records and routine care, rather than creating expensive artificial research environments. Patients receive normal care while data is automatically collected, making trials ${RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value}x cheaper than traditional methods.`,
        },
        {
          q: `How are they ${RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value}x cheaper?`,
          a: `Traditional trials cost $20B+ in recruitment, $15B in manual data collection, $10B in dedicated research sites, and $5B in regulatory overhead. Pragmatic trials eliminate these costs by using existing healthcare infrastructure, electronic health records, and streamlined protocols. Total savings: ${formatParameter(DFDA_BENEFIT_RD_ONLY_ANNUAL)} annually.`,
        },
        {
          q: "Are pragmatic trials as safe and rigorous as traditional trials?",
          a: `Yes. They follow the same scientific principles and regulatory standards. The difference is efficiency, not rigor. Oxford's RECOVERY trial (pragmatic design) enrolled 40,000 patients in months and found effective COVID treatments while traditional trials were still recruiting. Same safety, ${RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value}x faster and cheaper.`,
        },
        {
          q: "What treatments could be tested?",
          a: "Everything: new drugs, repurposed existing medications, medical devices, surgical techniques, behavioral interventions, prevention strategies. Pragmatic trials excel at comparing real-world effectiveness of treatments, finding optimal doses, and identifying which patients benefit most.",
        },
        {
          q: "How long until we see results?",
          a: "Immediate impact. Pragmatic trials can begin enrolling patients within weeks of approval. Results for acute conditions (like COVID treatments) can come in months. Chronic disease trials take longer but still deliver answers years faster than traditional methods.",
        },
      ],
    },
    {
      category: "THE PEACE DIVIDEND",
      questions: [
        {
          q: "What is the peace dividend?",
          a: `The peace dividend is the ${formatParameter(PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT)} in annual benefits from reducing global conflict by just 1%. This includes ${formatParameter(PEACE_DIVIDEND_DIRECT_COSTS)} in direct costs saved (military spending, infrastructure not destroyed, lives saved, trade not disrupted) plus ${formatParameter(PEACE_DIVIDEND_INDIRECT_COSTS)} in indirect costs avoided (lost economic growth, veteran healthcare, refugee support, environmental cleanup, PTSD treatment, lost human capital).`,
        },
        {
          q: "How does reducing military spending by 1% reduce conflict by 1%?",
          a: "It doesn't automatically. But the treaty creates incentives for cooperation: nations that participate gain health benefits while reducing threat perception. The 1% reduction is symbolic of commitment to peaceful cooperation. The real peace dividend comes from the diplomatic framework and shared investment in human welfare rather than nuclear weapons.",
        },
        {
          q: `Isn't ${formatParameter(PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT)} an exaggeration?`,
          a: `No, it's conservative. Global conflict costs $14.4 trillion annually (Institute for Economics and Peace). A 1% reduction saves $144B, but we only count ${formatParameter(PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT)} to be cautious. The breakdown is fully documented with sources on our research page.`,
        },
      ],
    },
    {
      category: "FEASIBILITY & IMPLEMENTATION",
      questions: [
        {
          q: "Is this realistic?",
          a: `Yes. Every government on Earth gives in when half of humanity publicly demands something. Not out of virtue. Out of survival. No government survives defying half its own voters. They cannot even keep parking rules against half their voters. The target is roughly ${formatParameter(GLOBAL_REGISTERED_VOTERS)} — a majority of humans on Earth. You also have a track record here: you banned chemical weapons (1993, 193 countries), biological weapons (1975, 187 countries), and landmines (1997, 164 countries). You've signed treaties banning weapons you actually like using. This one just asks you to buy 1% fewer of them.`,
        },
        {
          q: "How would the Decentralized Institutes of Health be governed?",
          a: "DIH operates as a decentralized network, not a centralized bureaucracy. Participating nations contribute 1% of military spending to a transparent fund. Research priorities are set democratically with input from patients, doctors, and scientists. Trials are conducted by existing healthcare systems. No new massive institution required.",
        },
        {
          q: "What about pharmaceutical company opposition?",
          a: `Pharma companies benefit too. Pragmatic trials reduce their R&D costs by ${RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value}x, accelerating time-to-market and expanding the range of profitable treatments. Repurposed drugs and rare disease treatments become economically viable. The current system is broken for everyone; this fixes it.`,
        },
        {
          q: "How do we prevent corruption and ensure transparency?",
          a: "Blockchain-based fund tracking, open-source protocols, public trial registries, and real-time results publication. All spending is transparent. All data is public. All decisions are documented. The decentralized structure prevents any single entity from controlling the system.",
        },
      ],
    },
    {
      category: "GETTING INVOLVED",
      questions: [
        {
          q: "How can I help?",
          a: showPoliticalContent
            ? "Answer the question on our homepage, share your referral link, join our divisions registry if you represent an organization, donate to support the movement, contact your representatives, and spread the word. Every voice counts toward a majority of humans on Earth."
            : "Answer the question on our homepage, share your referral link, join our divisions registry if you represent an organization, donate to support our research, and spread the word. Every voice counts toward a majority of humans on Earth.",
        },
        {
          q: "I'm a researcher/doctor. How can I participate?",
          a: "Join our divisions registry, connect with allied organizations, advocate for pragmatic trial adoption in your institution, and help design protocols. We need clinical expertise to make this vision real.",
        },
        {
          q: "I'm a policymaker. What do you need from me?",
          a: showPoliticalContent
            ? "Introduce the bill. Tell people you introduced the bill. Accept credit when it passes. The humans you represent are currently dying of diseases that faster trials would cure sooner. This is the policy issue where doing the right thing and getting reelected are, for once, the same calculation. We can provide the bill text, the numbers, and the constituent demand. The rest is your job."
            : "Learn about pragmatic trials and their potential to transform healthcare efficiency. Review our research on cost-effectiveness and real-world implementation. Consider how evidence-based policy could improve healthcare outcomes in your jurisdiction.",
        },
        {
          q: "What if my country doesn't participate?",
          a: "You still benefit. The treaty creates global public goods: faster medical progress, reduced conflict, and shared knowledge. Even non-participating countries gain access to trial results and treatment advances. But participating countries get priority access and influence over research priorities.",
        },
      ],
    },
  ]

  // Use configured FAQ or fallback to default
  const title = config.faq?.title || 'FREQUENTLY ASKED QUESTIONS'
  const subtitle = config.faq?.subtitle || 'Everything you need to know about the 1% Treaty and the war on disease'
  const faqSections = config.faq?.sections || fallbackFaqs
  const ctaSection = config.faq?.ctaSection

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <SectionContainer bgColor="pink" borderPosition="bottom" padding="lg">
          <Container size="md">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase text-center mb-6">
              {title}
            </h1>
            <p className="text-xl md:text-2xl font-bold text-center">
              {subtitle}
            </p>
          </Container>
        </SectionContainer>

        {/* FAQ Sections */}
        <SectionContainer bgColor="background" borderPosition="none" padding="lg">
          <Container size="md" className="space-y-16">
            {faqSections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-3xl md:text-4xl font-black uppercase mb-8 text-brutal-pink border-b-4 border-primary pb-4">
                  {section.category}
                </h2>
                <div className="space-y-8">
                  {section.questions.map((faq, qIdx) => (
                    <Card key={qIdx} className="p-6 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <h3 className="text-xl md:text-2xl font-black uppercase mb-4 text-brutal-pink">{faq.q}</h3>
                      <p className="text-lg leading-relaxed">{faq.a}</p>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </Container>
        </SectionContainer>

        {/* CTA Section */}
        {ctaSection && (
          <SectionContainer bgColor="yellow" borderPosition="top" padding="lg">
            <Container size="md" className="text-center">
              <h2 className="text-3xl md:text-4xl font-black uppercase mb-6">{ctaSection.title}</h2>
              <p className="text-xl font-bold mb-8">{ctaSection.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {ctaSection.buttons.map((button, idx) => (
                  <a
                    key={idx}
                    href={button.href}
                    className={`px-8 py-4 text-xl font-black uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all ${
                      button.variant === 'secondary'
                        ? 'bg-background text-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {button.label}
                  </a>
                ))}
              </div>
            </Container>
          </SectionContainer>
        )}
      </div>
    </Layout>
  )
}
