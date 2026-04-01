import { NavItemLink } from "@/components/navigation/NavItemLink";
import { earthOptimizationPrizePaperLink } from "@/lib/routes";
import { GameCTA } from "@/components/ui/game-cta";
import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  fmtParam,
} from "@optimitron/data/parameters";
const coreCards = [
  {
    title: "Dominant Assurance",
    description:
      `Deposit USDC into the Earth Optimization Prize fund. Plan fails after 15 years? ~${fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} your money back. Plan succeeds? Everyone benefits from higher GDP. You literally cannot lose money. The worst case is getting richer.`,
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
  },
  {
    title: "Two Terminal Metrics",
    description:
      "Median healthy life years and median real after-tax income. Health gets 50%. Income gets 50%. Everything else is an intermediate variable. If those two numbers don't move, nobody gets paid.",
    color: "bg-brutal-yellow",
    textColor: "text-brutal-yellow-foreground",
  },
  {
    title: "Referral Recruitment",
    description:
      "Share your referral link. Every person who verifies support for the 1% Treaty via World ID earns you 1 VOTE point. Metrics hit targets after 15 years? VOTE holders split the pool pro-rata. No deposit required to recruit.",
    color: "bg-brutal-cyan",
    textColor: "text-brutal-cyan-foreground",
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
    <section className="bg-brutal-yellow text-brutal-yellow-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            The Earth Optimization Prize
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto font-bold">
            Not a grant. Not a charity. A coordination game that pays everyone
            who proved demand for the 1% Treaty — but only if the metrics
            actually move. Recruit verified voters now. Get paid in 15 years if
            it worked.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {coreCards.map((card) => (
            <div
              key={card.title}
              className={`p-6 border-4 border-primary ${card.color} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
            >
              <h3 className={`text-lg font-black ${card.textColor} mb-3 uppercase`}>
                {card.title}
              </h3>
              <p className={`text-sm ${card.textColor} leading-relaxed font-bold`}>
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <GameCTA href="/prize#invest" variant="yellow" size="lg">Play the Game</GameCTA>
            <NavItemLink
              item={earthOptimizationPrizePaperLink}
              variant="custom"
              external
              className="inline-flex items-center text-sm font-black uppercase hover:underline transition-colors"
            >
              Read the paper &rarr;
            </NavItemLink>
          </div>
        </div>
      </div>
    </section>
  );
}
