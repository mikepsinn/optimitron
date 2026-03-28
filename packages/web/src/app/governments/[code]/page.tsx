import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  GOVERNMENTS,
  getGovernment,
  getGovernmentsByHALE,
  getMilitaryToGovernmentClinicalTrialRatio,
  getMilitaryToGovernmentMedicalResearchRatio,
  getAgencyPerformanceByCountry,
  ALL_HISTORICAL_TRENDS,
} from "@optimitron/data";
import { GameCTA } from "@/components/ui/game-cta";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { HumanityScoreboard } from "@/components/shared/HumanityScoreboard";
import { AgencyGradeChart } from "@/components/shared/AgencyGradeChart";
import { HistoricalTrendChart } from "@/components/shared/HistoricalTrendChart";
import {
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
} from "@optimitron/data/parameters";

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

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatRatio(value: number): string {
  if (value >= 1000) return `${Math.round(value).toLocaleString()}:1`;
  if (value >= 100) return `${value.toFixed(0)}:1`;
  return `${value.toFixed(1)}:1`;
}

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  source?: string;
  url?: string;
  color?: "pink" | "cyan" | "yellow" | "red" | "background";
}

function StatCard({ label, value, subtitle, source, url, color = "background" }: StatCardProps) {
  return (
    <BrutalCard bgColor={color} shadowSize={4} padding="md">
      <div className="text-xs font-black uppercase text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-2xl sm:text-3xl font-black text-foreground">
        {value}
      </div>
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

  const clinicalTrialRatio = getMilitaryToGovernmentClinicalTrialRatio(gov);
  const medicalResearchRatio = getMilitaryToGovernmentMedicalResearchRatio(gov);
  const haleRanked = getGovernmentsByHALE();
  const haleRank = haleRanked.findIndex((g) => g.code === gov.code) + 1;

  const haleGap = gov.hale
    ? TREATY_PROJECTED_HALE_YEAR_15.value - gov.hale.value
    : null;

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

      {/* Game Metrics — the two numbers that matter */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
          Game Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <BrutalCard bgColor="cyan" shadowSize={8} padding="lg">
            <div className="text-xs font-black uppercase text-muted-foreground mb-2">
              Healthy Life Years (HALE)
            </div>
            <div className="text-5xl sm:text-6xl font-black text-foreground mb-2">
              {gov.hale?.value.toFixed(1) ?? "—"}
            </div>
            <div className="text-lg font-bold text-foreground">
              Global average: <ParameterValue param={GLOBAL_HALE_CURRENT} /> &middot; Treaty target: <ParameterValue param={TREATY_PROJECTED_HALE_YEAR_15} />
            </div>
            {haleGap !== null && haleGap > 0 && (
              <div className="text-base font-bold text-muted-foreground mt-1">
                Needs +{haleGap.toFixed(1)} years to hit treaty target
              </div>
            )}
          </BrutalCard>

          <BrutalCard bgColor="yellow" shadowSize={8} padding="lg">
            <div className="text-xs font-black uppercase text-muted-foreground mb-2">
              GDP Per Capita
            </div>
            <div className="text-5xl sm:text-6xl font-black text-foreground mb-2">
              {formatUSD(gov.gdpPerCapita.value)}
            </div>
            {gov.medianIncome && (
              <div className="text-lg font-bold text-foreground">
                Median income: {formatUSD(gov.medianIncome.value)}
              </div>
            )}
            <div className="text-base font-bold text-muted-foreground mt-1">
              {gov.gdpPerCapita.source}
            </div>
          </BrutalCard>
        </div>

        {/* Humanity's Scoreboard for context */}
        <HumanityScoreboard />
      </section>

      {/* Spending Profile */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
          Spending Profile
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            label="Military Spending/yr"
            value={formatUSD(gov.militarySpendingAnnual.value)}
            subtitle={`${gov.militaryPctGDP.value}% of GDP`}
            source={gov.militarySpendingAnnual.source}
            url={gov.militarySpendingAnnual.url}
            color="pink"
          />
          <StatCard
            label="Health Spending/capita"
            value={formatUSD(gov.healthSpendingPerCapita.value)}
            source={gov.healthSpendingPerCapita.source}
            url={gov.healthSpendingPerCapita.url}
            color="cyan"
          />
          {clinicalTrialRatio !== null && (
            <StatCard
              label="Military : Trials Ratio"
              value={formatRatio(clinicalTrialRatio)}
              subtitle="Weapons per $1 of government clinical trials"
              color={clinicalTrialRatio > 1 ? "red" : "cyan"}
            />
          )}
          {medicalResearchRatio !== null && (
            <StatCard
              label="Military : Research Ratio"
              value={formatRatio(medicalResearchRatio)}
              subtitle="Weapons per $1 of total government medical research"
              color={medicalResearchRatio > 1 ? "red" : "cyan"}
            />
          )}
          {gov.govMedicalResearchSpending && (
            <StatCard
              label="Gov Medical Research/yr"
              value={formatUSD(gov.govMedicalResearchSpending.value)}
              subtitle="Total research budget (basic science + overhead + admin)"
              source={gov.govMedicalResearchSpending.source}
              url={gov.govMedicalResearchSpending.url}
            />
          )}
          {gov.clinicalTrialSpending && (
            <StatCard
              label="Gov Clinical Trials/yr"
              value={formatUSD(gov.clinicalTrialSpending.value)}
              subtitle="Actual interventional trials, not total research overhead"
              source={gov.clinicalTrialSpending.source}
              url={gov.clinicalTrialSpending.url}
              color="red"
            />
          )}
          <StatCard
            label="Arms Exports/yr"
            value={formatUSD(gov.armsExportsAnnual.value)}
            source={gov.armsExportsAnnual.source}
            url={gov.armsExportsAnnual.url}
          />
          <StatCard
            label="Debt"
            value={`${gov.debtPctGDP.value}% of GDP`}
            source={gov.debtPctGDP.source}
          />
          {gov.corporateWelfareAnnual && (
            <StatCard
              label="Corporate Welfare/yr"
              value={formatUSD(gov.corporateWelfareAnnual.value)}
              source={gov.corporateWelfareAnnual.source}
              url={gov.corporateWelfareAnnual.url}
              color="yellow"
            />
          )}
          {gov.fossilFuelSubsidies && (
            <StatCard
              label="Fossil Fuel Subsidies/yr"
              value={formatUSD(gov.fossilFuelSubsidies.value)}
              source={gov.fossilFuelSubsidies.source}
              url={gov.fossilFuelSubsidies.url}
              color="yellow"
            />
          )}
        </div>
      </section>

      {/* Body Count */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
          Body Count
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            label="Military Deaths Caused"
            value={formatNumber(gov.militaryDeathsCaused.value)}
            subtitle={gov.militaryDeathsCaused.period}
            source={gov.militaryDeathsCaused.source}
            url={gov.militaryDeathsCaused.url}
            color="red"
          />
          {gov.civilianDeathsCaused && (
            <StatCard
              label="Civilian Deaths"
              value={formatNumber(gov.civilianDeathsCaused.value)}
              source={gov.civilianDeathsCaused.source}
              url={gov.civilianDeathsCaused.url}
              color="red"
            />
          )}
          <StatCard
            label="Nuclear Warheads"
            value={formatNumber(gov.nuclearWarheads.value)}
            source={gov.nuclearWarheads.source}
            url={gov.nuclearWarheads.url}
            color={gov.nuclearWarheads.value > 0 ? "red" : "cyan"}
          />
          {gov.countriesBombed && (
            <StatCard
              label="Countries Bombed"
              value={formatNumber(gov.countriesBombed.value)}
              source={gov.countriesBombed.source}
              url={gov.countriesBombed.url}
              color="red"
            />
          )}
          {gov.droneStrikes && (
            <StatCard
              label="Drone Strikes"
              value={formatNumber(gov.droneStrikes.value)}
              source={gov.droneStrikes.source}
              url={gov.droneStrikes.url}
            />
          )}
          {gov.refugeesCreated && (
            <StatCard
              label="Refugees Created"
              value={formatNumber(gov.refugeesCreated.value)}
              source={gov.refugeesCreated.source}
              url={gov.refugeesCreated.url}
            />
          )}
          {gov.sanctionsDeathsAttributed && (
            <StatCard
              label="Sanctions Deaths"
              value={formatNumber(gov.sanctionsDeathsAttributed.value)}
              source={gov.sanctionsDeathsAttributed.source}
            />
          )}
        </div>
        {gov.countriesBombed && gov.countriesBombed.value > 0 && (
          <div className="mt-4 border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-black uppercase text-muted-foreground mb-1">
              Countries Bombed
            </p>
            <p className="text-sm font-bold text-foreground">
              {gov.countriesBombed.list}
            </p>
          </div>
        )}
      </section>

      {/* Justice & Domestic */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
          Justice &amp; Domestic
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            label="Homicide Rate /100K"
            value={gov.homicideRate.value.toFixed(1)}
            source={gov.homicideRate.source}
            url={gov.homicideRate.url}
          />
          {gov.murderClearanceRate && (
            <StatCard
              label="Murders Solved"
              value={`${gov.murderClearanceRate.value}%`}
              source={gov.murderClearanceRate.source}
              url={gov.murderClearanceRate.url}
              color={gov.murderClearanceRate.value < 60 ? "yellow" : "cyan"}
            />
          )}
          <StatCard
            label="Incarceration /100K"
            value={formatNumber(gov.incarcerationRate.value)}
            source={gov.incarcerationRate.source}
            url={gov.incarcerationRate.url}
          />
          {gov.drugPrisoners && (
            <StatCard
              label="Drug Prisoners"
              value={formatNumber(gov.drugPrisoners.value)}
              source={gov.drugPrisoners.source}
              url={gov.drugPrisoners.url}
            />
          )}
          {gov.drugWarSpendingAnnual && (
            <StatCard
              label="Drug War Spending/yr"
              value={formatUSD(gov.drugWarSpendingAnnual.value)}
              source={gov.drugWarSpendingAnnual.source}
              url={gov.drugWarSpendingAnnual.url}
            />
          )}
          {gov.drugOverdoseDeaths && (
            <StatCard
              label="Overdose Deaths/yr"
              value={formatNumber(gov.drugOverdoseDeaths.value)}
              source={gov.drugOverdoseDeaths.source}
              url={gov.drugOverdoseDeaths.url}
              color="pink"
            />
          )}
          {gov.policeKillingsAnnual && (
            <StatCard
              label="Police Killings/yr"
              value={formatNumber(gov.policeKillingsAnnual.value)}
              source={gov.policeKillingsAnnual.source}
              url={gov.policeKillingsAnnual.url}
            />
          )}
          {gov.privatePrisonPopulation && (
            <StatCard
              label="Private Prison Population"
              value={formatNumber(gov.privatePrisonPopulation.value)}
              source={gov.privatePrisonPopulation.source}
              url={gov.privatePrisonPopulation.url}
            />
          )}
        </div>
      </section>

      {/* Agency Performance Grades */}
      {(() => {
        const agencies = getAgencyPerformanceByCountry(gov.code);
        if (agencies.length === 0) return null;
        return (
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-2">
              Agency Report Cards
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
            Before vs After: Did the Agency Change the Trend?
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
        <div className="border-4 border-primary bg-brutal-yellow p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-3 text-2xl font-black uppercase text-foreground">
            {gov.name} Politician Alignment
          </h2>
          <p className="mb-6 text-lg font-bold text-foreground">
            How do {gov.name}&apos;s politicians actually vote compared to what
            citizens want? The scoreboard makes the gap impossible to ignore.
          </p>
          <GameCTA
            href={`/governments/${gov.code}/politicians`}
            variant="secondary"
            size="lg"
          >
            See Politician Scores
          </GameCTA>
        </div>
      </section>

      {/* CTA */}
      <section className="border-4 border-primary bg-brutal-cyan p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-3 text-2xl font-black uppercase text-foreground">
          Fix {gov.name}&apos;s Score
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-lg font-bold text-foreground">
          These numbers change when enough people demand it. Vote on the 1%
          Treaty, share with friends, and make {gov.name}&apos;s dysfunction
          impossible to ignore.
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
