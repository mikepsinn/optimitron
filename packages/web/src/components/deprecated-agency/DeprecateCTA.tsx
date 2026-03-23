import { CTASection } from "@/components/ui/cta-section";
import { GameCTA } from "@/components/ui/game-cta";

export function DeprecateCTA() {
  return (
    <CTASection
      heading="Help Deprecate Them"
      description="Every deprecated agency is one less thing standing between humanity and functional governance. Fund the referendum. See the full system. Set your priorities."
      bgColor="red"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <GameCTA href="/prize" variant="secondary">
          Fund the Referendum
        </GameCTA>
        <GameCTA href="/money" variant="outline">
          See the Full System
        </GameCTA>
        <GameCTA href="/agencies" variant="outline">
          All Deprecated Agencies
        </GameCTA>
      </div>
    </CTASection>
  );
}
