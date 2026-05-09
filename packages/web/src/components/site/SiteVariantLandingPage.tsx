import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { SectionContainer } from "@/components/ui/section-container";
import type { SiteConfig } from "@/lib/site";

export function SiteVariantLandingPage({ site }: { site: SiteConfig }) {
  const initiative = site.initiative;

  return (
    <SectionContainer bgColor="background" padding="lg">
      <Container size="lg">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-pixel text-xs font-black uppercase tracking-[0.18em] text-foreground">
            {initiative.eyebrow}
          </p>
          <h1 className="mt-5 text-4xl font-black uppercase leading-tight tracking-tight sm:text-6xl">
            {initiative.name}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-bold leading-8 text-muted-foreground">
            {initiative.description}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {site.homeActions.map((action) => (
              <GameCTA
                key={action.href}
                href={action.href}
                size="lg"
                variant={action.variant ?? "outline"}
              >
                {action.label}
              </GameCTA>
            ))}
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}
