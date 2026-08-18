import type { ReactNode } from "react";
import {
  CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  EFFICACY_LAG_YEARS,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  GLOBAL_DISEASE_DEATHS_DAILY,
  WILLING_TRIAL_PARTICIPANTS_GLOBAL,
} from "@optimitron/data/parameters";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { dfdaSpecPaperLink, invisibleGraveyardPaperLink } from "@/lib/routes";

interface GraveyardStat {
  detail: ReactNode;
  label: string;
  value: ReactNode;
}

const graveyardStats: GraveyardStat[] = [
  {
    // Intentionally show 95%; the dialog retains the related canonical 6,650-disease count and confidence interval.
    value: (
      <ParameterValue
        param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
        valueOverride="95%"
      />
    ),
    label: "Rare diseases without an FDA-approved treatment",
    detail:
      "Not because treatments are impossible. Because nobody ran the trial.",
  },
  {
    value: (
      <ParameterValue
        param={EFFICACY_LAG_YEARS}
        valueOverride={`${EFFICACY_LAG_YEARS.value.toFixed(1)} years`}
      />
    ),
    label: "Wait after safety testing",
    detail:
      "Proven safe. Just sitting there. Being safe. While people die.",
  },
  {
    value: (
      <ParameterValue
        param={EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL}
        valueOverride={`${Math.round(
          EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL.value / 1e6,
        )}M deaths`}
      />
    ),
    label: "Modeled deaths during the wait",
    detail:
      "The model's primary estimate for 1962–2024. Inspect the assumptions.",
  },
  {
    value: (
      <ParameterValue
        param={CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE}
        valueOverride={`${(
          CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE.value * 100
        ).toFixed(2)}%`}
      />
    ),
    label: "Current annual trial participation",
    detail: (
      <>
        About{" "}
        <ParameterValue
          param={WILLING_TRIAL_PARTICIPANTS_GLOBAL}
          presentation="inline"
          valueOverride="1.08 billion"
        />{" "}
        patients are willing. The current system enrolls{" "}
        <ParameterValue
          param={CURRENT_TRIAL_SLOTS_AVAILABLE}
          presentation="inline"
          valueOverride="1.9 million"
        />{" "}
        a year.
      </>
    ),
  },
];

export function InvisibleGraveyardSection() {
  return (
    <SectionContainer bgColor="background" borderPosition="both" padding="lg">
      <Container>
        <SectionHeader
          title="The Invisible Graveyard"
          subtitle={
            <>
              Disease and aging kill{" "}
              <ParameterValue
                param={GLOBAL_DISEASE_DEATHS_DAILY}
                presentation="inline"
                valueOverride={GLOBAL_DISEASE_DEATHS_DAILY.value.toLocaleString(
                  "en-US",
                )}
              />{" "}
              humans every day. Meanwhile, the money for finding treatments is
              busy being missiles.
            </>
          }
          size="lg"
        />

        <div className="mx-auto grid max-w-5xl gap-px border border-foreground bg-foreground sm:grid-cols-2">
          {graveyardStats.map((stat) => (
            <article key={stat.label} className="bg-background p-6 sm:p-8">
              <div className="text-3xl font-black text-foreground sm:text-4xl">
                {stat.value}
              </div>
              <h3 className="mt-3 text-sm font-black uppercase tracking-wide text-foreground">
                {stat.label}
              </h3>
              <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
                {stat.detail}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <NavItemLink
            item={invisibleGraveyardPaperLink}
            variant="custom"
            external
            className="inline-flex min-h-11 items-center justify-center border border-foreground px-5 py-3 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Read the Receipts
          </NavItemLink>
          <NavItemLink
            item={dfdaSpecPaperLink}
            variant="custom"
            external
            className="inline-flex min-h-11 items-center justify-center border border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
          >
            See the Solution
          </NavItemLink>
        </div>
      </Container>
    </SectionContainer>
  );
}
