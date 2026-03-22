import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StaggerGrid } from "@/components/animations/StaggerGrid";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { earthOptimizationPrizePaperLink } from "@/lib/routes";
import { PRIZE_POOL_15YR_MULTIPLE } from "@/lib/parameters-calculations-citations";
import { fmtParam } from "@/lib/format-parameter";

const coreCards = [
  {
    title: "Dominant Assurance",
    description:
      `Deposit USDC into the Wishocratic fund. Plan fails after 15 years? ~${fmtParam(PRIZE_POOL_15YR_MULTIPLE)} your money back. Plan succeeds? Everyone benefits from higher GDP. You literally cannot lose money. The worst case is getting richer.`,
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
  },
  {
    title: "Two Terminal Metrics",
    description:
      "Median healthy life years and median real after-tax income. Health gets 50%. Income gets 50%. Everything else is an intermediate variable. If those two numbers don't move, nobody gets paid.",
    color: "bg-brutal-yellow",
    textColor: "text-foreground",
  },
  {
    title: "Referral Recruitment",
    description:
      "Share your referral link. Every person who verifies support for the 1% Treaty via World ID earns you 1 VOTE point. Metrics hit targets after 15 years? VOTE holders split the pool pro-rata. No deposit required to recruit.",
    color: "bg-brutal-cyan",
    textColor: "text-foreground",
  },
  {
    title: "Anti-Capture",
    description:
      "Zero team allocation. No pre-sale. No admin keys. All on-chain. Anyone can verify. Your $100 gets exactly the same terms as $100,000.",
    color: "bg-background",
    textColor: "text-foreground",
  },
];

export function EarthOptimizationPrizeSection() {
  return (
    <section className="bg-brutal-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            The Earth Optimization Prize
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-bold">
            Not a grant. Not a charity. A coordination game that pays everyone
            who proved demand for the 1% Treaty — but only if the metrics
            actually move. Recruit verified voters now. Get paid in 15 years if
            it worked.
          </p>
        </ScrollReveal>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {coreCards.map((card) => (
            <div
              key={card.title}
              className={`p-6 border-4 border-primary ${card.color} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
            >
              <h3 className={`text-lg font-black ${card.textColor} mb-3 uppercase`}>
                {card.title}
              </h3>
              <p className={`text-sm ${card.textColor === "text-brutal-pink-foreground" ? "text-background" : "text-foreground"} leading-relaxed font-bold`}>
                {card.description}
              </p>
            </div>
          ))}
        </StaggerGrid>

        <ScrollReveal delay={0.3}>
          <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/prize#invest"
                className="px-8 py-3.5 bg-brutal-yellow text-foreground font-black uppercase text-lg border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                Join the Prize
              </a>
              <NavItemLink
                item={earthOptimizationPrizePaperLink}
                variant="custom"
                external
                className="inline-flex items-center text-sm font-black text-muted-foreground uppercase hover:text-foreground transition-colors"
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
