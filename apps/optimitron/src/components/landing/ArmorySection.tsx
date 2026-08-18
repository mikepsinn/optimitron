import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import { NavItemCard, NavItemCardGrid } from "@/components/ui/nav-item-card";
import {
  prizeLink,
  scoreboardLink,
  alignmentLink,
  transmitLink,
  governmentsLink,
  iabLink,
  demoLink,
  toolsLink,
  type NavItem,
} from "@/lib/routes";
import type { BrutalCardBgColor } from "@/components/ui/brutal-card";

const tools: { item: NavItem; bgColor: BrutalCardBgColor }[] = [
  { item: prizeLink, bgColor: "pink" },
  { item: scoreboardLink, bgColor: "cyan" },
  { item: alignmentLink, bgColor: "yellow" },
  { item: transmitLink, bgColor: "cyan" },
  { item: governmentsLink, bgColor: "red" },
  { item: iabLink, bgColor: "yellow" },
  { item: demoLink, bgColor: "cyan" },
];

export function ArmorySection() {
  return (
    <SectionContainer bgColor="yellow" borderPosition="top" padding="lg">
      <Container>
        <SectionHeader
          title="The Armory"
          subtitle="Your toolkit for fixing the mess described above. Browse. Equip. Try not to break anything important."
          size="lg"
        />
        <NavItemCardGrid columns={3}>
          {tools.map(({ item, bgColor }) => (
            <NavItemCard key={item.href} item={item} bgColor={bgColor} />
          ))}
        </NavItemCardGrid>
        <div className="mt-8 text-center">
          <GameCTA href={toolsLink.href} variant="secondary">
            Full Armory &rarr;
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
