import type { Metadata } from "next";
import { GOVERNMENTS, getGovernmentsByBodyCount, type GovernmentMetrics } from "@optimitron/data";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { GameCTA } from "@/components/ui/game-cta";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Government Report Cards | The Earth Optimization Game",
  description:
    "Every government ranked by body count. Nuclear warheads, military spending, civilian casualties, drug war prisoners, and unsolved murders. The data your government hopes you never see.",
};

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

interface StatItemProps {
  label: string;
  value: string;
  source?: string;
  url?: string;
  color?: "pink" | "cyan" | "yellow" | "default";
}

function StatItem({ label, value, source, url, color = "default" }: StatItemProps) {
  const valueColor =
    color === "pink"
      ? "text-brutal-pink"
      : color === "cyan"
        ? "text-brutal-cyan"
        : color === "yellow"
          ? "text-brutal-yellow"
          : "text-foreground";

  return (
    <div className="border-4 border-primary bg-background p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className={`text-lg font-black ${valueColor}`}>{value}</div>
      <div className="text-xs font-black uppercase text-muted-foreground">
        {label}
      </div>
      {source && (
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-bold text-brutal-pink hover:text-foreground transition-colors mt-1 block"
          >
            {source} ↗
          </a>
        ) : (
          <div className="text-[9px] font-bold text-muted-foreground mt-1">
            {source}
          </div>
        )
      )}
    </div>
  );
}

function GovernmentCard({
  gov,
  rank,
}: {
  gov: GovernmentMetrics;
  rank: number;
}) {
  const bgColor =
    rank === 1
      ? "bg-brutal-pink"
      : rank === 2
        ? "bg-brutal-yellow"
        : rank === 3
          ? "bg-brutal-cyan"
          : "bg-background";

  return (
    <div
      className={`border-4 border-primary ${bgColor} p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center border-4 border-primary bg-foreground text-2xl font-black text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {rank}
        </div>
        <div>
          <div className="text-4xl">{gov.flag}</div>
        </div>
        <div>
          <h2 className="text-xl font-black uppercase text-foreground">
            {gov.name}
          </h2>
          <p className="text-xs font-bold text-muted-foreground">
            {gov.militaryDeathsCaused.period}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatItem label="Body Count" value={formatNumber(gov.militaryDeathsCaused.value)} source={gov.militaryDeathsCaused.source} url={gov.militaryDeathsCaused.url} color="pink" />
        {gov.civilianDeathsCaused && <StatItem label="Civilian Deaths" value={formatNumber(gov.civilianDeathsCaused.value)} source={gov.civilianDeathsCaused.source} url={gov.civilianDeathsCaused.url} color="pink" />}
        {gov.countriesBombed && <StatItem label="Countries Bombed" value={formatNumber(gov.countriesBombed.value)} source={gov.countriesBombed.source} url={gov.countriesBombed.url} color="pink" />}
        <StatItem label="Nuclear Warheads" value={formatNumber(gov.nuclearWarheads.value)} source={gov.nuclearWarheads.source} url={gov.nuclearWarheads.url} color={gov.nuclearWarheads.value > 0 ? "pink" : "cyan"} />
        <StatItem label="Military Spending/yr" value={formatUSD(gov.militarySpendingAnnual.value)} source={gov.militarySpendingAnnual.source} url={gov.militarySpendingAnnual.url} />
        {gov.drugPrisoners && <StatItem label="Drug Prisoners" value={formatNumber(gov.drugPrisoners.value)} source={gov.drugPrisoners.source} url={gov.drugPrisoners.url} />}
        <StatItem label="Incarceration /100K" value={formatNumber(gov.incarcerationRate.value)} source={gov.incarcerationRate.source} url={gov.incarcerationRate.url} />
        {gov.murderClearanceRate && <StatItem label="Murders Solved" value={`${gov.murderClearanceRate.value}%`} source={gov.murderClearanceRate.source} url={gov.murderClearanceRate.url} color={gov.murderClearanceRate.value < 60 ? "yellow" : "cyan"} />}
        <StatItem label="Life Expectancy" value={`${gov.lifeExpectancy.value} yrs`} source={gov.lifeExpectancy.source} url={gov.lifeExpectancy.url} color="cyan" />
        <StatItem label="Health Spending/capita" value={formatUSD(gov.healthSpendingPerCapita.value)} source={gov.healthSpendingPerCapita.source} url={gov.healthSpendingPerCapita.url} />
        {gov.corporateWelfareAnnual && <StatItem label="Corporate Welfare/yr" value={formatUSD(gov.corporateWelfareAnnual.value)} source={gov.corporateWelfareAnnual.source} url={gov.corporateWelfareAnnual.url} color="yellow" />}
        {gov.fossilFuelSubsidies && <StatItem label="Fossil Fuel Subsidies/yr" value={formatUSD(gov.fossilFuelSubsidies.value)} source={gov.fossilFuelSubsidies.source} url={gov.fossilFuelSubsidies.url} color="yellow" />}
        {gov.farmSubsidies && <StatItem label="Farm Subsidies/yr" value={formatUSD(gov.farmSubsidies.value)} source={gov.farmSubsidies.source} url={gov.farmSubsidies.url} color="yellow" />}
      </div>

      {/* Countries Bombed List */}
      {gov.countriesBombed && gov.countriesBombed.value > 0 ? (
        <div className="mt-3 border-4 border-primary bg-background p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-black uppercase text-muted-foreground">
            Countries Bombed
          </p>
          <p className="mt-1 text-xs font-bold text-foreground">
            {gov.countriesBombed.list}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function GovernmentsPage() {
  const ranked = getGovernmentsByBodyCount();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <ArcadeTag>Government Report Cards</ArcadeTag>
          <h1 className="font-[family-name:var(--font-arcade)] text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl">
            BODY COUNT LEADERBOARD
          </h1>
          <p className="text-lg font-bold leading-relaxed text-foreground">
            On my planet, we publish government performance data the same way you
            publish restaurant hygiene ratings. Except you actually read those.
          </p>
          <p className="font-bold leading-relaxed text-muted-foreground">
            Below is every major government ranked by how many people they have
            killed since 1945. Nuclear warheads stockpiled, military spending
            burned, civilians bombed, drug war prisoners caged, and murders they
            could not be bothered to solve. The data is public. Your governments
            just hope you never look at it all in one place.
          </p>
        </div>
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
          <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black text-foreground">
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
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black text-foreground">
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
          <div className="border-4 border-primary bg-foreground p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black text-background">
              {GOVERNMENTS.length}
            </div>
            <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
              Governments Audited
            </div>
          </div>
        </div>
      </section>

      {/* Ranked List */}
      <section className="mb-16 space-y-8">
        {ranked.map((gov, i) => (
          <GovernmentCard key={gov.code} gov={gov} rank={i + 1} />
        ))}
      </section>

      {/* Wishonia Commentary */}
      <section className="mb-16">
        <div className="border-4 border-primary bg-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-4 text-2xl font-black uppercase text-background">
            THE PATTERN
          </h2>
          <p className="font-bold leading-relaxed text-background">
            Singapore has killed zero people. Zero. They have the highest GDP per
            capita on the list, the longest life expectancy, and a 96% murder
            clearance rate. Meanwhile, the countries at the top of the body count
            leaderboard can barely solve half their murders.
          </p>
          <p className="mt-4 font-bold leading-relaxed text-muted-foreground">
            It is almost as if killing people is not actually a prerequisite for
            running a successful country. Weird.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-4 border-primary bg-brutal-pink p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-3 text-2xl font-black uppercase text-brutal-pink-foreground">
          OPTIMISE THE GOVERNMENTS
        </h2>
        <p className="mx-auto mb-6 max-w-2xl font-bold leading-relaxed text-background">
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
