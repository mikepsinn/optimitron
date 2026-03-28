import { GameCTA } from "@/components/ui/game-cta";
import { ROUTES } from "@/lib/routes";

type CTASize = "sm" | "md" | "lg";

interface CanonicalCTAProps {
  size?: CTASize;
  className?: string;
}

/** Links to /agencies — "Your Government, Optimized" */
export function OptimizedGovernanceCTA({ size = "lg", className }: CanonicalCTAProps) {
  return (
    <GameCTA href={ROUTES.agencies} variant="secondary" size={size} className={className}>
      Your Government, Optimized
    </GameCTA>
  );
}

/** Links to /agencies/dcongress/referendums — "Play the Legislation Game" */
export function LegislationGameCTA({ size = "lg", className }: CanonicalCTAProps) {
  return (
    <GameCTA href={ROUTES.referendum} variant="cyan" size={size} className={className}>
      Play the Legislation Game
    </GameCTA>
  );
}

/** Links to /agencies/dcongress/wishocracy — "Play the Appropriations Game" */
export function AppropriationsGameCTA({ size = "lg", className }: CanonicalCTAProps) {
  return (
    <GameCTA href={ROUTES.wishocracy} variant="yellow" size={size} className={className}>
      Play the Appropriations Game
    </GameCTA>
  );
}

/** Links to /agencies/dfec/alignment — "Play the Accountability Game" */
export function AccountabilityGameCTA({ size = "lg", className }: CanonicalCTAProps) {
  return (
    <GameCTA href={ROUTES.alignment} variant="outline" size={size} className={className}>
      Play the Accountability Game
    </GameCTA>
  );
}

/** Links to /prize — "Play the Earth Optimization Game" */
export function EarthGameCTA({ size = "lg", className }: CanonicalCTAProps) {
  return (
    <GameCTA href={ROUTES.prize} variant="primary" size={size} className={className}>
      Play the Earth Optimization Game
    </GameCTA>
  );
}

/** Links to /census — "Report Your Census Data" */
export function CensusDataCTA({ size = "lg", className }: CanonicalCTAProps) {
  return (
    <GameCTA href={ROUTES.census} variant="secondary" size={size} className={className}>
      Report Your Census Data
    </GameCTA>
  );
}
