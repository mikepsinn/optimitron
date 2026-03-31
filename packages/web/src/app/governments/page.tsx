import { GOVERNMENTS } from "@optimitron/data";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { GameCTA } from "@/components/ui/game-cta";
import { GovernmentLeaderboard } from "@/components/shared/GovernmentLeaderboard";
import { GovernmentScatterplot } from "@/components/shared/GovernmentScatterplot";
import { governmentsLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(governmentsLink);

function formatUSD(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export default function GovernmentsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <ArcadeTag>Government Report Cards</ArcadeTag>
          <h1 className="font-pixel text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl">
            BODY COUNT LEADERBOARD
          </h1>
          <p className="text-lg font-bold leading-relaxed text-foreground">
            On my planet, we publish government performance data the same way you
            publish restaurant hygiene ratings. Except you actually read those.
          </p>
          <p className="font-bold leading-relaxed text-muted-foreground">
            Below is every major government ranked by sourced killings in the
            ledger, starting in 1913 where the historical record supports it and
            later where the state itself comes later. Nuclear warheads stockpiled,
            military spending burned, civilians bombed, drug war prisoners caged,
            and murders they could not be bothered to solve. The data is public.
            Your governments just hope you never look at it all in one place.
          </p>
        </div>
      </section>

      {/* Health & Wealth Leaderboard */}
      <section className="mb-16">
        <h2 className="font-pixel text-xl font-black uppercase tracking-tight text-foreground mb-2 sm:text-2xl">
          MOST MISALIGNED GOVERNMENTS
        </h2>
        <p className="text-lg font-bold text-muted-foreground mb-6">
          Default ranking is military spending per dollar of government clinical
          trials, from largest ratio to smallest. Click any column to sort by a
          different metric.
        </p>
        <GovernmentLeaderboard />
      </section>

      <section className="mb-16">
        <h2 className="font-pixel text-xl font-black uppercase tracking-tight text-foreground mb-2 sm:text-2xl">
          CORRELATION MAP
        </h2>
        <p className="text-lg font-bold text-muted-foreground mb-6">
          Start with military spending versus clinical trials against HALE, then
          swap either axis to compare any tracked metric pair.
        </p>
        <GovernmentScatterplot governments={GOVERNMENTS} />
      </section>

      {/* Summary Stats */}
      <section className="mb-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border-4 border-primary bg-brutal-pink p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black text-brutal-pink-foreground">
              {formatNumber(
                GOVERNMENTS.reduce(
                  (sum, g) => sum + g.militaryDeathsCaused.value,
                  0,
                ),
              )}
            </div>
            <div className="mt-1 text-xs font-black uppercase text-background">
              Total Body Count
            </div>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black">
              {formatNumber(
                GOVERNMENTS.reduce(
                  (sum, g) => sum + g.nuclearWarheads.value,
                  0,
                ),
              )}
            </div>
            <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
              Nuclear Warheads
            </div>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black">
              {formatUSD(
                GOVERNMENTS.reduce(
                  (sum, g) => sum + g.militarySpendingAnnual.value,
                  0,
                ),
              )}
            </div>
            <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
              Combined Military Spend/yr
            </div>
          </div>
          <div className="border-4 border-primary bg-foreground text-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black">
              {GOVERNMENTS.length}
            </div>
            <div className="mt-1 text-xs font-black uppercase opacity-70">
              Governments Audited
            </div>
          </div>
        </div>
      </section>

      {/* Wishonia Commentary */}
      <section className="mb-16">
        <div className="border-4 border-primary bg-foreground text-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-4 text-2xl font-black uppercase">
            THE PATTERN
          </h2>
          <p className="font-bold leading-relaxed">
            Singapore has killed zero people. Zero. They have the highest GDP per
            capita on the list, the longest life expectancy, and a 96% murder
            clearance rate. Meanwhile, the countries at the top of the body count
            leaderboard can barely solve half their murders.
          </p>
          <p className="mt-4 font-bold leading-relaxed">
            It is almost as if killing people is not actually a prerequisite for
            running a successful country. Weird.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-3 text-2xl font-black uppercase">
          OPTIMISE THE GOVERNMENTS
        </h2>
        <p className="mx-auto mb-6 max-w-2xl font-bold leading-relaxed">
          These numbers do not have to stay this way. The Earth Optimization Game
          lets you set priorities, rank policies by evidence, and hold your
          government accountable with data instead of shouting.
        </p>
        <GameCTA href={ROUTES.wishocracy} variant="secondary" size="lg">
          Play the Game
        </GameCTA>
      </section>
    </div>
  );
}
