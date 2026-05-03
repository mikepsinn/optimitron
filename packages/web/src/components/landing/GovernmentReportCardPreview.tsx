import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import { GovernmentLeaderboard } from "@/components/shared/GovernmentLeaderboard";
import { ROUTES } from "@/lib/routes";

export function GovernmentReportCardPreview() {
  return (
    <SectionContainer bgColor="background" borderPosition="top" padding="lg">
      <Container>
        <SectionHeader
          title="Worst Players: Governments"
          subtitle="Every government ranked by body count. The data they hope you never see."
          size="lg"
        />
        <GovernmentLeaderboard limit={10} compact />
        <div className="mt-8 text-center">
          <GameCTA href={ROUTES.governments} variant="primary">
            💀 See All Report Cards
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
