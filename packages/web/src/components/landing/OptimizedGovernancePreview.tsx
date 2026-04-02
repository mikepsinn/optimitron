import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import { NavItemCard, NavItemCardGrid } from "@/components/ui/nav-item-card";
import {
  agenciesLink,
  wishocracyLink,
  referendumLink,
  dtreasuryLink,
  dirsLink,
  federalReserveLink,
  dssaLink,
  opgLink,
  obgLink,
  transparencyLink,
  dihLink,
  dfdaLink,
  departmentOfWarLink,
  type NavItem,
} from "@/lib/routes";

const agencies: NavItem[] = [
  wishocracyLink,
  referendumLink,
  dtreasuryLink,
  federalReserveLink,
  dirsLink,
  dssaLink,
  opgLink,
  obgLink,
  transparencyLink,
  dihLink,
  dfdaLink,
  departmentOfWarLink,
];

export function OptimizedGovernancePreview() {
  return (
    <SectionContainer bgColor="background" borderPosition="top" padding="lg">
      <Container>
        <SectionHeader
          title="Optimized Governance"
          subtitle="Ten agencies running a civilisation. No bureaucracy, no corruption, no seventy-four-thousand-page tax code. Just code."
          size="lg"
        />
        <NavItemCardGrid columns={3}>
          {agencies.map((agency) => (
            <NavItemCard key={agency.href} item={agency} />
          ))}
        </NavItemCardGrid>
        <div className="mt-8 text-center">
          <GameCTA href={agenciesLink.href} variant="primary">
            🏛️ Explore All Agencies
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
