import { CTASection } from "@/components/ui/cta-section";
import { GameCTA } from "@/components/ui/game-cta";
import { ROUTES } from "@/lib/routes";

export function DeprecateCTA() {
  return (
    <CTASection
      heading="Help Deprecate Them"
      description="Every deprecated agency is one less thing standing between humanity and functional governance. Fund the referendum. See the full system. Set your priorities."
      bgColor="red"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <GameCTA href={ROUTES.prize} variant="secondary">
          Fund the Referendum
        </GameCTA>
        <GameCTA href={ROUTES.agencies} variant="outline">
          Optimized Governance
        </GameCTA>
        <GameCTA href={ROUTES.wishocracy} variant="outline">
          Set Your Priorities
        </GameCTA>
      </div>
    </CTASection>
  );
}
