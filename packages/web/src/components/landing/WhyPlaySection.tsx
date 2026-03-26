import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { BrutalCard } from "@/components/ui/brutal-card";
import { GameCTA } from "@/components/ui/game-cta";
import { Stat } from "@/components/ui/stat";
import {
  fmtParam,
  DESTRUCTIVE_ECONOMY_35PCT_YEAR,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  GLOBAL_DISEASE_DEATHS_DAILY,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
} from "@optimitron/data/parameters";
import { CTA } from "@/lib/messaging";
export function WhyPlaySection() {
  return (
    <SectionContainer bgColor="foreground" borderPosition="both" padding="lg">
      <Container>
        <div id="stakes">
          <SectionHeader
            title="What Happens If Nobody Plays"
            size="lg"
            className="text-background [&_p]:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Global Failed State */}
          <BrutalCard bgColor="red" shadowSize={8} padding="lg">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black text-brutal-red-foreground mb-2">
              {Math.round(DESTRUCTIVE_ECONOMY_35PCT_YEAR.value)}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-brutal-red-foreground mb-3">
              Global Failed State
            </h3>
            <p className="text-lg sm:text-xl font-bold text-brutal-red-foreground leading-relaxed">
              The parasitic economy — military + cybercrime — hits 35% of GDP.
              Every civilisation that hit this threshold collapsed. This
              isn&apos;t a prediction. It&apos;s compound interest.
            </p>
          </BrutalCard>

          {/* Card 2: Dysfunction Tax */}
          <BrutalCard bgColor="background" shadowSize={8} padding="lg">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-2">
              {fmtParam({
                ...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
                unit: "USD",
              })}
              /yr
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-foreground mb-3">
              The Dysfunction Tax
            </h3>
            <p className="text-lg sm:text-xl font-bold text-foreground leading-relaxed">
              {fmtParam({ ...GLOBAL_DISEASE_DEATHS_DAILY, unit: "" })}{" "}
              deaths/day from treatable diseases. Your share:{" "}
              <Stat param={POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL} />
              /yr.
            </p>
          </BrutalCard>

          {/* Card 3: The Fix */}
          <BrutalCard bgColor="cyan" shadowSize={8} padding="lg">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-2">
              1%
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-foreground mb-3">
              The Fix That&apos;s Sitting Right There
            </h3>
            <p className="text-lg sm:text-xl font-bold text-foreground leading-relaxed">
              1% of military &rarr; clinical trials.{" "}
              <Stat param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED} />{" "}
              lives saved. ROI: essentially infinite.
            </p>
          </BrutalCard>
        </div>

        {/* Punchline */}
        <div className="text-center">
          <p className="text-xl sm:text-2xl font-black text-background mb-6">
            You are currently losing. You chose it by not choosing.
          </p>
          <GameCTA href="#vote" variant="primary" size="lg">
            {CTA.playNow}
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
