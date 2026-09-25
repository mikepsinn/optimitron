import type { ReactNode } from "react";
import Link from "next/link";
import {
  ALIGNED_ELECTION_COMMISSION_ANNUAL_OPEX,
  AUTOMATED_REVENUE_SERVICE_ANNUAL_OPEX,
  IMMIGRATION_DIVIDEND_PER_CITIZEN_ANNUAL,
  IRS_ANNUAL_OPERATING_BUDGET,
  POLITICAL_DYSFUNCTION_GLOBAL_MIGRATION_OPPORTUNITY_COST,
  RECOVERY_TRIAL_COST_PER_PATIENT,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  UNIVERSAL_SECURITY_ADMIN_ALL_IN_COST_PER_CITIZEN_ANNUAL,
  UNIVERSAL_SECURITY_ADMIN_ANNUAL_OPEX,
  US_GOV_WASTE_TAX_COMPLIANCE,
  US_TOTAL_FEDERAL_CAMPAIGN_SPENDING_2024,
  type Parameter,
} from "@optimitron/data/parameters";
import { AGENCIES } from "@optimitron/data/datasets/wishonia-agencies";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { ROUTES } from "@/lib/routes";
import { compactUsd, wholeUsd } from "./format";
import { LandingSection, accentTextClass, landingLinkClass } from "./LandingSection";

function Money({ param, whole = false }: { param: Parameter; whole?: boolean }) {
  return (
    <ParameterValue
      param={param}
      valueOverride={whole ? wholeUsd(param.value) : compactUsd(param.value)}
    />
  );
}

const SUITE: ReadonlyArray<{
  agency: { dName: string; id: string; replacesAgencyName: string };
  href: string;
  price: ReactNode;
  paying: ReactNode;
}> = [
  {
    agency: AGENCIES.dfda,
    href: ROUTES.dfda,
    price: (
      <>
        <Money param={RECOVERY_TRIAL_COST_PER_PATIENT} whole /> a patient
      </>
    ),
    paying: (
      <>
        <Money param={TRADITIONAL_PHASE3_COST_PER_PATIENT} whole /> a patient
      </>
    ),
  },
  {
    agency: AGENCIES.dirs,
    href: ROUTES.dtreasuryDirs,
    price: (
      <>
        <Money param={AUTOMATED_REVENUE_SERVICE_ANNUAL_OPEX} /> a year
      </>
    ),
    paying: (
      <>
        <Money param={IRS_ANNUAL_OPERATING_BUDGET} /> a year, plus{" "}
        <Money param={US_GOV_WASTE_TAX_COMPLIANCE} /> in filing costs
      </>
    ),
  },
  {
    agency: AGENCIES.dssa,
    href: ROUTES.dtreasuryDssa,
    price: (
      <>
        <Money param={UNIVERSAL_SECURITY_ADMIN_ANNUAL_OPEX} /> a year,{" "}
        <ParameterValue
          param={UNIVERSAL_SECURITY_ADMIN_ALL_IN_COST_PER_CITIZEN_ANNUAL}
          valueOverride={`${Math.round(UNIVERSAL_SECURITY_ADMIN_ALL_IN_COST_PER_CITIZEN_ANNUAL.value * 100)}¢`}
        />{" "}
        a citizen
      </>
    ),
    paying: "83 welfare programs, each with its own bureaucracy",
  },
  {
    agency: AGENCIES.dfec,
    href: ROUTES.dfec,
    price: (
      <>
        <Money param={ALIGNED_ELECTION_COMMISSION_ANNUAL_OPEX} /> a year
      </>
    ),
    paying: (
      <>
        <Money param={US_TOTAL_FEDERAL_CAMPAIGN_SPENDING_2024} /> of donor money in the 2024
        federal elections
      </>
    ),
  },
  {
    agency: AGENCIES.dmove,
    href: `${ROUTES.agencies}/${AGENCIES.dmove.id}`,
    price: (
      <>
        Pays each citizen <Money param={IMMIGRATION_DIVIDEND_PER_CITIZEN_ANNUAL} whole /> a
        year
      </>
    ),
    paying: (
      <>
        <Money param={POLITICAL_DYSFUNCTION_GLOBAL_MIGRATION_OPPORTUNITY_COST} /> a year in lost
        output worldwide
      </>
    ),
  },
];

export function ReplacementSuiteSection() {
  return (
    <LandingSection
      id="suite"
      note="What each replacement costs, next to what you pay now"
      title="The government replacement suite"
    >
      <div
        aria-hidden="true"
        className="hidden grid-cols-[1.4fr_1fr_1fr] gap-6 border-b border-foreground/15 pb-3 font-mono text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground md:grid"
      >
        <span>Product</span>
        <span>Retail price</span>
        <span>Currently paying</span>
      </div>
      <ul>
        {SUITE.map(({ agency, href, paying, price }) => (
          <li
            className="grid gap-3 border-b border-foreground/15 py-4 text-sm md:grid-cols-[1.4fr_1fr_1fr] md:gap-6"
            key={agency.id}
          >
            <div>
              <Link
                className="font-bold underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
                href={href}
              >
                {agency.dName}
              </Link>
              <p className="mt-1 text-muted-foreground">Replaces {agency.replacesAgencyName}</p>
            </div>
            <p className={`font-mono font-bold ${accentTextClass}`}>
              <span className="mr-2 font-sans font-normal text-muted-foreground md:hidden">
                Retail price:
              </span>
              {price}
            </p>
            <p className="font-mono">
              <span className="mr-2 font-sans text-muted-foreground md:hidden">
                Currently paying:
              </span>
              {paying}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link className={landingLinkClass} href={ROUTES.agencies}>
          See every agency
        </Link>
      </div>
    </LandingSection>
  );
}
