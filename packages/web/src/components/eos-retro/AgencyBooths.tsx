import Link from "next/link";
import { AGENCIES, WISHONIA_AGENCIES, type WishoniaAgency } from "@optimitron/data/datasets/wishonia-agencies";
import { US_AGENCY_PERFORMANCE } from "@optimitron/data/datasets/agency-performance";
import { ROUTES } from "@/lib/routes";

/**
 * Eight featured booths from the 22-agency registry: name, what it
 * replaces, one savings stat, one or two lines of the real replacement
 * code, and the Earth agency's report-card grade where the performance
 * dataset has one. All content is data-driven from the registries.
 */

interface BoothConfig {
  agency: WishoniaAgency;
  /** Substring anchor locating the code line(s) to excerpt. */
  codeAnchor: string;
  /** Extra lines after the anchor line. */
  extraLines?: number;
  /** Override when annualSavings is not a plain dollars-per-year figure. */
  statValue?: string;
  statCaption?: string;
}

export const BOOTHS: BoothConfig[] = [
  {
    agency: AGENCIES.dirs,
    codeAnchor: "taxAmount = (value * taxRateBps)",
    statCaption: "recovered every year, mostly from paperwork",
  },
  {
    agency: AGENCIES.dfed,
    codeAnchor: "maxSupply = _initialSupply",
    statValue: "96%",
    statCaption: "of the dollar's purchasing power lost since 1913, no longer confiscatable",
  },
  {
    agency: AGENCIES.dssa,
    codeAnchor: "perCitizen = balance / citizenList.length",
    statCaption: "in annual admin overhead deleted by one for-loop",
  },
  {
    agency: AGENCIES.dcensus,
    codeAnchor: "return citizenList.length",
    statValue: "$1.4B",
    statCaption: "a year saved by one view function that never undercounts",
  },
  {
    agency: AGENCIES.ddod,
    codeAnchor: "There is no replacement code",
    extraLines: 1,
    statCaption: "in annual global military spending on a negative-sum game",
  },
  {
    agency: AGENCIES.dih,
    codeAnchor: "severity * SUBSIDY_PER_DALY",
    statCaption: "a year redirected from grant paperwork to actual trials",
  },
  {
    agency: AGENCIES.dedu,
    codeAnchor: "educationWallet.credit",
    statCaption: "a year of compliance churn; money follows the child instead",
  },
  {
    agency: AGENCIES.dhome,
    codeAnchor: "permitByRight",
    statCaption: "a year of scarcity management replaced by permission to build",
  },
];

function excerptCode(code: string, anchor: string, extraLines = 0): string {
  const lines = code.split("\n");
  const start = lines.findIndex((line) => line.includes(anchor));
  if (start === -1) {
    return lines.filter((l) => l.trim().length > 0).slice(0, 1 + extraLines).join("\n");
  }
  return lines
    .slice(start, start + 1 + extraLines)
    .map((l) => l.trim())
    .join("\n");
}

function earthGradeFor(agency: WishoniaAgency): string | null {
  for (const earthId of agency.replaces) {
    const perf = US_AGENCY_PERFORMANCE.find((p) => p.agencyId === earthId);
    if (perf) return perf.grade;
  }
  return null;
}

/** Canonical hrefs for agencies whose pages live under /agencies/dtreasury. */
const CANONICAL_AGENCY_HREFS: Record<string, string> = {
  dirs: ROUTES.dtreasuryDirs,
  dfed: ROUTES.dtreasuryDfed,
  dssa: ROUTES.dtreasuryDssa,
};

function boothHref(agencyId: string): string {
  return CANONICAL_AGENCY_HREFS[agencyId] ?? `${ROUTES.agencies}/${agencyId}`;
}

export function AgencyBooths() {
  return (
    <div>
      <div className="er-booth-grid">
        {BOOTHS.map(({ agency, codeAnchor, extraLines, statValue, statCaption }) => {
          const grade = earthGradeFor(agency);
          return (
            <div className="er-booth" key={agency.id}>
              <div className="flex items-start justify-between gap-2">
                <span aria-hidden="true" className="text-2xl">
                  {agency.emoji}
                </span>
                {grade ? (
                  <span
                    aria-label={`Earth's version currently grades ${grade}`}
                    className="er-grade"
                    data-tier={grade === "A" || grade === "B" ? "good" : grade === "C" ? "mid" : "bad"}
                    title="Earth's version, graded by spending vs outcomes"
                  >
                    {grade}
                  </span>
                ) : null}
              </div>
              <p className="er-card-title text-sm">{agency.dName}</p>
              <p className="er-caption">Replaces {agency.replacesAgencyName}</p>
              <p className="er-booth-stat">{statValue ?? agency.annualSavings}</p>
              {statCaption ? <p className="er-caption">{statCaption}</p> : null}
              <code className="er-code-chip">
                {excerptCode(agency.replacementCode, codeAnchor, extraLines)}
              </code>
              <Link className="er-link er-mono mt-auto text-xs" href={boothHref(agency.id)}>
                Visit the booth
              </Link>
            </div>
          );
        })}
      </div>
      <p className="er-caption mt-4">
        The letter chip is the Earth agency&apos;s current report-card
        grade, computed from its spending trend against its outcome trend.
      </p>
      <div className="mt-8 text-center">
        <Link className="er-btn" href={ROUTES.agencies}>
          See all {WISHONIA_AGENCIES.length} departments
        </Link>
      </div>
    </div>
  );
}
