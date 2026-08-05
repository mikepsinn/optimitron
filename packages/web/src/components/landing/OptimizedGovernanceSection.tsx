import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import { NavItemCard, NavItemCardGrid } from "@/components/ui/nav-item-card";
import {
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
  agenciesLink,
  type NavItem,
} from "@/lib/routes";
import type { BrutalCardBgColor } from "@/components/ui/brutal-card";

const agencies: { item: NavItem; bgColor: BrutalCardBgColor }[] = [
  { item: wishocracyLink, bgColor: "yellow" },
  { item: referendumLink, bgColor: "cyan" },
  { item: dtreasuryLink, bgColor: "pink" },
  { item: federalReserveLink, bgColor: "cyan" },
  { item: dirsLink, bgColor: "yellow" },
  { item: dssaLink, bgColor: "cyan" },
  { item: opgLink, bgColor: "cyan" },
  { item: obgLink, bgColor: "red" },
  { item: transparencyLink, bgColor: "cyan" },
  { item: dihLink, bgColor: "pink" },
  { item: dfdaLink, bgColor: "cyan" },
  { item: departmentOfWarLink, bgColor: "red" },
];

export function OptimizedGovernanceSection({
  subtitle = "Every agency redesigned around one question: what does the data say actually works?",
  title = "Optimized Governance",
}: {
  subtitle?: string;
  title?: string;
}) {
  return (
    <SectionContainer bgColor="background" borderPosition="top" padding="lg">
      <Container>
        <SectionHeader title={title} subtitle={subtitle} size="lg" />
        <NavItemCardGrid columns={3}>
          {agencies.map(({ item, bgColor }) => (
            <NavItemCard key={item.href} item={item} bgColor={bgColor} />
          ))}
        </NavItemCardGrid>
        <div className="mt-8 text-center">
          <GameCTA href={agenciesLink.href} variant="secondary">
            See every agency &rarr;
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
