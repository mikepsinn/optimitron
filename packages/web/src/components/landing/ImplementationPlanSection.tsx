import { NavItemLink } from "@/components/navigation/NavItemLink";
import { fullManualPaperLink } from "@/lib/routes";
import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  fmtParam,
} from "@optimitron/data/parameters";
const steps = [
  {
    step: 1,
    title: "Prove Demand",
    description:
      `Depositors fund the Earth Optimization Prize. Recruiters share referral links and get people to verify support for the 1% Treaty via World ID. Every verified voter earns the recruiter a VOTE point. Depositors get ~${fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} their money back if the plan fails. Recruiters get prize share if it succeeds. Pluralistic ignorance collapses.`,
    why: "Depositors get a yield floor. Recruiters earn VOTE points. Self-interest does the coordination.",
  },
  {
    step: 2,
    title: "The Great Clicking",
    description:
      "Citizens do pairwise comparisons on their priorities. Ten comparisons, two minutes, and the eigenvector decomposition produces a stable budget allocation. Enough people click and you have a mandate no politician can ignore.",
    why: "It takes less time than complaining on social media.",
  },
  {
    step: 3,
    title: "Lobby for the Treaty",
    description:
      "Demand is proven. Now sell Incentive Alignment Bonds to raise ~$1B for the lobbying campaign. Treaty revenue splits 80/10/10 by smart contract: 80% funds pragmatic clinical trials, 10% returns to bondholders, 10% funds a SuperPAC for aligned politicians. Self-reinforcing loop: diseases cured → GDP rises → everyone lobbies for expansion.",
    why: `Attractive return profile. Fail? ~${fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} back. Succeed? Perpetual 10% of treaty revenue.`,
  },
  {
    step: 4,
    title: "Full Optimization",
    description:
      "Automate monetary policy for 0% inflation. Replace the IRS and welfare bureaucracy with a flat 0.5% transaction tax and Universal Basic Income. Automate Congress through Wishocratic allocation — 8 billion people directing public goods spending via pairwise comparisons instead of 535 politicians directing it based on campaign donors.",
    why: "Cheaper, fairer, and the spreadsheet agrees it's better.",
  },
  {
    step: 5,
    title: "Enjoy Results",
    description:
      "Median healthy life years go up. Median real income goes up. The dysfunction tax disappears. Bondholders get paid. Recruiters get paid. Everyone wins except the middlemen. Oh well.",
    why: "You like living longer and having more money. Presumably.",
  },
];

export function ImplementationPlanSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
          Five Steps. No Altruism Required.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-bold">
          Every step runs on self-interest. I&apos;ve been governing for four
          millennia. &ldquo;Be nice&rdquo; has never once been a load-bearing
          policy. Greed, though? Greed scales beautifully.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((item) => (
          <div
            key={item.step}
            className="p-6 border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-12 h-12 bg-brutal-pink border-4 border-primary flex items-center justify-center text-lg font-black text-brutal-pink-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-foreground mb-2 uppercase">
                  {item.title}
                </h3>
                <p className="text-sm text-foreground leading-relaxed font-bold mb-2">
                  {item.description}
                </p>
                <p className="text-xs font-black text-brutal-pink uppercase">
                  Why it happens: {item.why}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <NavItemLink
          item={fullManualPaperLink}
          variant="custom"
          external
          className="inline-flex items-center text-sm font-black text-brutal-pink uppercase hover:text-foreground transition-colors"
        >
          Read the full manual &rarr;
        </NavItemLink>
      </div>
    </section>
  );
}
