import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StaggerGrid } from "@/components/animations/StaggerGrid";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { earthOptimizationPrizePaperLink } from "@/lib/routes";

const coreCards = [
  {
    title: "Dominant Assurance",
    description:
      "Depositors put USDC into Aave V3 yield. Plan fails after 15 years? ~4.2x your money back. Plan succeeds? Everyone benefits from higher GDP. You literally cannot lose money. The worst case is getting richer.",
    color: "bg-brutal-pink",
    textColor: "text-white",
  },
  {
    title: "Two Terminal Metrics",
    description:
      "Median healthy life years and median real after-tax income. Health gets 50%. Income gets 50%. Everything else is an intermediate variable. If those two numbers don't move, nobody gets paid.",
    color: "bg-brutal-yellow",
    textColor: "text-black",
  },
  {
    title: "Referral Recruitment",
    description:
      "Share your referral link. Every person who verifies support for the 1% Treaty via World ID earns you 1 VOTE token. Plan succeeds? VOTE holders claim proportional prize share. No deposit required to recruit.",
    color: "bg-brutal-cyan",
    textColor: "text-black",
  },
  {
    title: "Anti-Capture",
    description:
      "Any team can submit a v2 plan that beats v1 on cost per DALY averted. The protocol itself is replaceable. Outcome perpetuity beats extraction. If you can do it better, the prize is yours.",
    color: "bg-white",
    textColor: "text-black",
  },
];

const bountyStages = [
  {
    stage: "01",
    label: "Specification",
    description: "Publish the plan. Define metrics. Set thresholds.",
  },
  {
    stage: "02",
    label: "Pilot",
    description: "Run in one jurisdiction. Prove the model works.",
  },
  {
    stage: "03",
    label: "Adoption",
    description: "Scale to multiple jurisdictions. Compound evidence.",
  },
  {
    stage: "04",
    label: "Outcome Perpetuity",
    description: "Metrics cross thresholds. Pool unlocks. Implementers get paid.",
  },
];

export function EarthOptimizationPrizeSection() {
  return (
    <section className="bg-brutal-yellow/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Earth Optimization Prize
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            A standing market where greed does the coordination. Not a grant programme.
            Not a charity. A market mechanism that pays whoever produces measurable
            reductions in human suffering — after the outcomes exist.
          </p>
        </ScrollReveal>

        {/* Core cards 2x2 */}
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {coreCards.map((card) => (
            <div
              key={card.title}
              className={`p-6 border-4 border-black ${card.color} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
            >
              <h3 className={`text-lg font-black ${card.textColor} mb-3 uppercase`}>
                {card.title}
              </h3>
              <p className={`text-sm ${card.textColor === "text-white" ? "text-white/80" : "text-black/70"} leading-relaxed font-medium`}>
                {card.description}
              </p>
            </div>
          ))}
        </StaggerGrid>

        {/* 4-stage bounty strip */}
        <ScrollReveal>
          <div className="p-6 border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-12">
            <h3 className="text-lg font-black text-black mb-6 uppercase text-center">
              Four-Stage Bounty
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bountyStages.map((item) => (
                <div key={item.stage} className="text-center">
                  <div className="w-10 h-10 bg-brutal-yellow border-2 border-black flex items-center justify-center mx-auto mb-3 text-sm font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {item.stage}
                  </div>
                  <h4 className="font-black text-black text-sm mb-1 uppercase">
                    {item.label}
                  </h4>
                  <p className="text-xs text-black/60 font-medium">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/prize#invest"
                className="px-8 py-3.5 bg-brutal-yellow text-black font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Join the Prize
              </a>
              <NavItemLink
                item={earthOptimizationPrizePaperLink}
                variant="custom"
                external
                className="inline-flex items-center text-sm font-black text-black/40 uppercase hover:text-black transition-colors"
              >
                Read the paper &rarr;
              </NavItemLink>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
