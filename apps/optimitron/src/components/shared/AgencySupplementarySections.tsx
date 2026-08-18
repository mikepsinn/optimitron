import {
  getAgencySupplementarySections,
  type SupplementarySection,
  type StatCardItem,
} from "@optimitron/data/datasets/agency-supplementary";
import type { CIACoup } from "@optimitron/data/datasets/us-cia-coups";
import type { FDAApprovedDrugDisaster } from "@optimitron/data/datasets/us-fda-approved-drug-deaths";
import type { GovernmentLie } from "@optimitron/data/datasets/us-government-lies";
import type { IronicLaw } from "@optimitron/data/datasets/us-ironic-laws";
import type { LobbyingIndustry } from "@optimitron/data/datasets/us-lobbying";
import type { RevolvingDoorStat } from "@optimitron/data/datasets/us-revolving-door";
import { SupplementaryStatCards } from "./SupplementaryStatCards";
import { DrugDisasterTable } from "./DrugDisasterTable";
import { LieComparisonCard } from "./LieComparisonCard";
import { IronicLawCallout } from "./IronicLawCallout";
import { CoupTable } from "./CoupTable";
import { LobbyingCard } from "./LobbyingCard";
import { BrutalCard } from "@/components/ui/brutal-card";

function renderSection(section: SupplementarySection) {
  switch (section.type) {
    case "stat-cards":
      return (
        <SupplementaryStatCards
          title={section.title}
          subtitle={section.subtitle}
          items={section.data as StatCardItem[]}
          columns={2}
        />
      );
    case "drug-disasters":
      return (
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-2">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-base font-bold text-muted-foreground mb-4">
              {section.subtitle}
            </p>
          )}
          <DrugDisasterTable disasters={section.data as FDAApprovedDrugDisaster[]} />
        </section>
      );
    case "lie":
      return (
        <section className="mb-12">
          {section.title && (
            <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
              {section.title}
            </h2>
          )}
          <LieComparisonCard lie={section.data as GovernmentLie} />
        </section>
      );
    case "ironic-law":
      return <IronicLawCallout law={section.data as IronicLaw} />;
    case "coups":
      return (
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-2">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-base font-bold text-muted-foreground mb-4">
              {section.subtitle}
            </p>
          )}
          <CoupTable coups={section.data as CIACoup[]} />
        </section>
      );
    case "lobbying":
      return (
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
            {section.title}
          </h2>
          <LobbyingCard industry={section.data as LobbyingIndustry} />
        </section>
      );
    case "revolving-door": {
      const stat = section.data as RevolvingDoorStat;
      return (
        <section className="mb-12">
          <BrutalCard bgColor="red" shadowSize={8} padding="lg">
            <div className="text-xs font-black uppercase text-brutal-red-foreground mb-2">
              {section.title}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-brutal-red-foreground mb-2">
              {stat.value}
            </div>
            <p className="text-base font-bold text-brutal-red-foreground">
              {stat.description}
            </p>
            {stat.sourceUrl && (
              <a
                href={stat.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-brutal-red-foreground mt-2 block hover:underline"
              >
                {stat.source} ↗
              </a>
            )}
          </BrutalCard>
        </section>
      );
    }
    default:
      return null;
  }
}

interface AgencySupplementarySectionsProps {
  agencyId: string;
}

/**
 * Renders all supplementary data sections for an agency.
 * Content is driven entirely by the data package registry —
 * no agency-specific logic in the web app.
 */
export function AgencySupplementarySections({ agencyId }: AgencySupplementarySectionsProps) {
  const sections = getAgencySupplementarySections(agencyId);
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
    </>
  );
}
