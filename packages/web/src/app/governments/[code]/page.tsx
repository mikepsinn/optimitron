import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  GOVERNMENTS,
  getGovernment,
  getGovernmentsByHALE,
  getAgencyPerformanceByCountry,
  ALL_HISTORICAL_TRENDS,
  getMilitaryToGovernmentClinicalTrialRatio,
  getMilitaryToGovernmentMedicalResearchRatio,
} from "@optimitron/data";
import { GameCTA } from "@/components/ui/game-cta";
import { BrutalCard } from "@/components/ui/brutal-card";
import { SpendingBar } from "@/components/ui/spending-bar";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { AgencyGradeChart } from "@/components/shared/AgencyGradeChart";
import { HistoricalTrendChart } from "@/components/shared/HistoricalTrendChart";
import {
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
} from "@optimitron/data/parameters";
import { getGovernmentDetailSections } from "@/lib/government-detail-stats";

interface PageProps {
  params: Promise<{ code: string }>;
}

export function generateStaticParams() {
  return GOVERNMENTS.map((g) => ({ code: g.code }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const gov = getGovernment(code.toUpperCase());
  if (!gov) return { title: "Country Not Found" };
  return {
    title: `${gov.name} Government Scorecard | The Earth Optimization Game`,
    description: `${gov.name}'s performance on the two metrics that matter: healthy life years and income. Plus military spending, health outcomes, and body count.`,
  };
}

function formatUSD(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

interface StatCardProps {
  label: string;
  value: string;
  emoji?: string;
  subtitle?: string;
  source?: string;
  url?: string;
  barValue?: number;
  barMax?: number;
  barColor?: "red" | "cyan" | "green" | "yellow";
}

function StatCard({ label, value, emoji, subtitle, source, url, barValue, barMax, barColor }: StatCardProps) {
  return (
    <BrutalCard bgColor="background" shadowSize={4} padding="md">
      <div className="flex items-center gap-1.5 mb-1">
        {emoji && <span className="text-base">{emoji}</span>}
        <div className="text-xs font-black uppercase text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-black text-foreground">
        {value}
      </div>
      {barValue != null && barMax != null && barColor && (
        <SpendingBar
          value={barValue}
          max={barMax}
          color={barColor}
          height="sm"
          className="mt-2"
        />
      )}
      {subtitle && (
        <div className="text-sm font-bold text-muted-foreground mt-1">
          {subtitle}
        </div>
      )}
      {source && (
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-brutal-pink hover:text-foreground transition-colors mt-2 block"
          >
            {source} ↗
          </a>
        ) : (
          <div className="text-[10px] font-bold text-muted-foreground mt-2">
            {source}
          </div>
        )
      )}
    </BrutalCard>
  );
}

export default async function GovernmentDetailPage({ params }: PageProps) {
  const { code } = await params;
  const gov = getGovernment(code.toUpperCase());
  if (!gov) notFound();

  const haleRanked = getGovernmentsByHALE();
  const haleRank = haleRanked.findIndex((g) => g.code === gov.code) + 1;
  const detailSections = getGovernmentDetailSections(gov);

  const haleGap = gov.hale
    ? TREATY_PROJECTED_HALE_YEAR_15.value - gov.hale.value
    : null;

  // Compute maxes across all governments for bar scaling
  const maxMilitary = Math.max(...haleRanked.map((g) => g.militarySpendingAnnual.value), 1);
  const maxHale = Math.max(...haleRanked.map((g) => g.hale?.value ?? 0), 1);
  const maxGdpPC = Math.max(...haleRanked.map((g) => g.gdpPerCapita.value), 1);
  const maxKilled = Math.max(...haleRanked.map((g) => g.militaryDeathsCaused.value), 1);
  const maxHealthPC = Math.max(...haleRanked.map((g) => g.healthSpendingPerCapita.value), 1);
  const maxTrialRatio = Math.max(
    ...haleRanked
      .map((g) => getMilitaryToGovernmentClinicalTrialRatio(g))
      .filter((r): r is number => r !== null && r < 999_999),
    1,
  );

  const trialRatio = getMilitaryToGovernmentClinicalTrialRatio(gov);
  const researchRatio = getMilitaryToGovernmentMedicalResearchRatio(gov);

  // Bar config for spending profile cards
  const spendingBarConfig: Record<string, { value: number; max: number; color: "red" | "cyan" | "green" | "yellow" }> = {
    "Military Spending/yr": { value: gov.militarySpendingAnnual.value, max: maxMilitary, color: "red" },
    "Health Spending/capita": { value: gov.healthSpendingPerCapita.value, max: maxHealthPC, color: "cyan" },
    "Life Expectancy": { value: gov.lifeExpectancy.value, max: 90, color: "green" },
    "Military : Trials Ratio": { value: trialRatio ?? 0, max: maxTrialRatio, color: "red" },
    "Military : Research Ratio": { value: researchRatio ?? 0, max: Math.max(trialRatio ?? 0, researchRatio ?? 0, 100), color: "red" },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-12">
        <Link
          href="/governments"
          className="text-sm font-black uppercase text-muted-foreground hover:text-brutal-pink transition-colors"
        >
          &larr; All Governments
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-6xl">{gov.flag}</span>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
              {gov.name}
            </h1>
            <p className="text-lg font-bold text-muted-foreground">
              #{haleRank} of {haleRanked.length} by healthy life years
            </p>
          </div>
        </div>
      </section>

      {/* Score card — full width like politician page */}
      {trialRatio !== null && (
        <section className="mb-6">
          <BrutalCard bgColor="yellow" shadowSize={8} padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-xs font-black uppercase text-brutal-yellow-foreground mb-1">
                  ⚔️ Military : 🧪 Trials Ratio
                </div>
                <div className="text-3xl sm:text-4xl font-black text-brutal-red">
                  {trialRatio >= 1000 ? `${Math.round(trialRatio).toLocaleString()}:1` : `${trialRatio.toFixed(1)}:1`}
                </div>
              </div>
              <p className="text-xs font-bold text-muted-foreground max-w-xs">
                For every $1 spent finding out which medicines work, {gov.name} spends ${Math.round(trialRatio).toLocaleString()} on military.
              </p>
            </div>
            <SpendingBar
              value={trialRatio}
              max={maxTrialRatio}
              color="red"
              height="md"
              className="mt-3"
            />
          </BrutalCard>
        </section>
      )}

      {/* Game Metrics — the two numbers that matter */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
          🎮 Game Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BrutalCard bgColor="cyan" shadowSize={8} padding="lg">
            <div className="text-xs font-black uppercase text-foreground mb-2">
              ❤️ Healthy Life Years (HALE)
            </div>
            <div className="text-5xl sm:text-6xl font-black text-foreground mb-2">
              {gov.hale?.value.toFixed(1) ?? "—"}
            </div>
            <SpendingBar
              value={gov.hale?.value ?? 0}
              max={maxHale}
              color="cyan"
              height="md"
              className="mb-3"
            />
            <div className="text-base font-bold text-foreground">
              Global avg: <ParameterValue param={GLOBAL_HALE_CURRENT} /> · Target: <ParameterValue param={TREATY_PROJECTED_HALE_YEAR_15} />
            </div>
            {haleGap !== null && haleGap > 0 && (
              <div className="text-sm font-bold text-muted-foreground mt-1">
                Needs +{haleGap.toFixed(1)} years to hit treaty target
              </div>
            )}
          </BrutalCard>

          <BrutalCard bgColor="green" shadowSize={8} padding="lg">
            <div className="text-xs font-black uppercase text-brutal-green-foreground mb-2">
              💰 GDP Per Capita
            </div>
            <div className="text-5xl sm:text-6xl font-black text-brutal-green-foreground mb-2">
              {formatUSD(gov.gdpPerCapita.value)}
            </div>
            <SpendingBar
              value={gov.gdpPerCapita.value}
              max={maxGdpPC}
              color="green"
              height="md"
              className="mb-3"
            />
            {gov.medianIncome && (
              <div className="text-base font-bold text-brutal-green-foreground">
                Median income: {formatUSD(gov.medianIncome.value)}
              </div>
            )}
            <div className="text-sm font-bold text-muted-foreground mt-1">
              {gov.gdpPerCapita.source}
            </div>
          </BrutalCard>
        </div>
      </section>

      {/* Military vs Medicine — big comparison bars */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
          💣 Military vs 🧪 Medicine
        </h2>
        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-black uppercase text-brutal-red">
                  💣 Military Spending
                </span>
                <span className="text-sm font-black text-foreground">
                  {formatUSD(gov.militarySpendingAnnual.value)}/yr
                </span>
              </div>
              <SpendingBar
                value={gov.militarySpendingAnnual.value}
                max={maxMilitary}
                color="red"
                height="md"
              />
            </div>
            {gov.clinicalTrialSpending && (
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-black uppercase text-brutal-cyan">
                    🧪 Clinical Trials
                  </span>
                  <span className="text-sm font-black text-foreground">
                    {formatUSD(gov.clinicalTrialSpending.value)}/yr
                  </span>
                </div>
                <SpendingBar
                  value={gov.clinicalTrialSpending.value}
                  max={gov.militarySpendingAnnual.value}
                  color="cyan"
                  height="md"
                />
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Scaled to the same axis as military — the bar is {
                    gov.militarySpendingAnnual.value > 0
                      ? `${(gov.clinicalTrialSpending.value / gov.militarySpendingAnnual.value * 100).toFixed(2)}%`
                      : "a fraction"
                  } of military spending
                </p>
              </div>
            )}
            {gov.govMedicalResearchSpending && (
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-black uppercase text-brutal-cyan">
                    🧬 Total Medical Research
                  </span>
                  <span className="text-sm font-black text-foreground">
                    {formatUSD(gov.govMedicalResearchSpending.value)}/yr
                  </span>
                </div>
                <SpendingBar
                  value={gov.govMedicalResearchSpending.value}
                  max={gov.militarySpendingAnnual.value}
                  color="cyan"
                  height="md"
                />
              </div>
            )}
            {gov.healthSpendingPerCapita && (
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-black uppercase text-brutal-green">
                    🏥 Health Spending / Capita
                  </span>
                  <span className="text-sm font-black text-foreground">
                    {formatUSD(gov.healthSpendingPerCapita.value)}
                  </span>
                </div>
                <SpendingBar
                  value={gov.healthSpendingPerCapita.value}
                  max={maxHealthPC}
                  color="green"
                  height="md"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Spending Profile */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
          📊 Spending Profile
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {detailSections.spendingProfile.map((stat) => {
            const bar = spendingBarConfig[stat.label];
            return (
              <StatCard
                key={stat.label}
                label={stat.label}
                emoji={stat.emoji}
                value={stat.value}
                subtitle={stat.subtitle}
                source={stat.source}
                url={stat.url}
                barValue={bar?.value}
                barMax={bar?.max}
                barColor={bar?.color}
              />
            );
          })}
        </div>
      </section>

      {/* Body Count */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
          💀 Body Count
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {detailSections.bodyCount.map((stat) => {
            const isBodyCount = stat.label === "Body Count";
            return (
              <StatCard
                key={stat.label}
                label={stat.label}
                emoji={stat.emoji}
                value={stat.value}
                subtitle={stat.subtitle}
                source={stat.source}
                url={stat.url}
                barValue={isBodyCount ? gov.militaryDeathsCaused.value : undefined}
                barMax={isBodyCount ? maxKilled : undefined}
                barColor={isBodyCount ? "red" : undefined}
              />
            );
          })}
        </div>
        {gov.countriesBombed && gov.countriesBombed.value > 0 && (
          <div className="mt-4 border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-black uppercase text-muted-foreground mb-1">
              💥 Countries Bombed
            </p>
            <p className="text-sm font-bold text-foreground">
              {gov.countriesBombed.list}
            </p>
          </div>
        )}
        {gov.deathLedgerEntries && gov.deathLedgerEntries.length > 0 && (
          <div className="mt-6 border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="border-b-4 border-primary px-4 py-3">
              <h3 className="text-sm font-black uppercase text-foreground">
                📜 Death Ledger
              </h3>
              <p className="mt-1 text-sm font-bold text-muted-foreground">
                Sourced regime and conflict entries summed into the body-count total.
              </p>
            </div>
            <div className="divide-y-2 divide-primary">
              {gov.deathLedgerEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_10rem_9rem]"
                >
                  <div>
                    <div className="text-base font-black text-foreground">
                      {entry.label}
                    </div>
                    <div className="mt-1 text-sm font-bold text-muted-foreground">
                      {entry.notes}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.sourceLinks.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-black text-brutal-pink hover:text-foreground transition-colors"
                        >
                          {source.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-xs font-black uppercase text-muted-foreground">
                      Period
                    </div>
                    <div className="text-sm font-black text-foreground">
                      {entry.startYear}–{entry.endYear}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-xs font-black uppercase text-muted-foreground">
                      Deaths
                    </div>
                    <div className="text-lg font-black text-foreground">
                      {entry.deaths.toLocaleString()}
                    </div>
                    <SpendingBar
                      value={entry.deaths}
                      max={Math.max(...(gov.deathLedgerEntries ?? []).map((e) => e.deaths), 1)}
                      color="red"
                      height="sm"
                      className="mt-1"
                    />
                    <div className="text-[10px] font-black uppercase text-muted-foreground mt-1">
                      {entry.method}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Justice & Domestic */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
          ⚖️ Justice &amp; Domestic
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {detailSections.justiceAndDomestic.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              emoji={stat.emoji}
              value={stat.value}
              subtitle={stat.subtitle}
              source={stat.source}
              url={stat.url}
            />
          ))}
        </div>
      </section>

      {/* Agency Performance Grades */}
      {(() => {
        const agencies = getAgencyPerformanceByCountry(gov.code);
        if (agencies.length === 0) return null;
        return (
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-2">
              🏛️ Agency Report Cards
            </h2>
            <p className="text-base font-bold text-muted-foreground mb-6">
              Spending over time vs. outcomes over time. If the lines diverge —
              spending up, outcomes flat or worse — the agency is failing its
              mission. Letter grade is computed from trend analysis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agencies.map((agency) => (
                <AgencyGradeChart key={agency.agencyId} agency={agency} />
              ))}
            </div>
          </section>
        );
      })()}

      {/* Historical Trends — Before vs After Agency Creation */}
      {gov.code === "US" && ALL_HISTORICAL_TRENDS.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-2">
            📈 Before vs After: Did the Agency Change the Trend?
          </h2>
          <p className="text-base font-bold text-muted-foreground mb-6">
            The red dashed line shows when each agency was created. If the trend
            was already improving before the agency existed and didn&apos;t
            accelerate after — the agency didn&apos;t help.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ALL_HISTORICAL_TRENDS.map((trend) => (
              <HistoricalTrendChart
                key={trend.agencyId}
                trend={trend}
                seriesIndices={[0]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Politician Alignment */}
      <section className="mb-12">
        <BrutalCard bgColor="pink" shadowSize={8} padding="lg">
          <h2 className="mb-3 text-2xl font-black uppercase text-brutal-pink-foreground">
            🗳️ {gov.name} Politician Alignment
          </h2>
          <p className="mb-6 text-lg font-bold text-brutal-pink-foreground">
            Every politician&apos;s votes scored against what citizens actually want
            via pairwise comparison. The gap between what they vote for and what
            you&apos;d vote for, expressed as a single number.
          </p>
          <GameCTA
            href={`/governments/${gov.code}/politicians`}
            variant="primary"
            size="lg"
          >
            See Politician Scores
          </GameCTA>
        </BrutalCard>
      </section>

      {/* CTA */}
      <section className="border-4 border-primary bg-brutal-cyan p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-3 text-2xl font-black uppercase text-foreground">
          🎯 Fix {gov.name}&apos;s Score
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-lg font-bold text-foreground">
          {gov.name} spends {formatUSD(gov.militarySpendingAnnual.value)}/yr on
          military and {gov.clinicalTrialSpending ? formatUSD(gov.clinicalTrialSpending.value) : "almost nothing"}/yr
          testing which medicines work. The 1% Treaty redirects 1% of the first
          number to the second. The deposit funds the campaign to make it happen.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="/#vote" variant="primary" size="lg">
            Play Now
          </GameCTA>
          <GameCTA href="/governments" variant="secondary" size="lg">
            All Governments
          </GameCTA>
        </div>
      </section>
    </div>
  );
}
