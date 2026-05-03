import { GameCTA } from "@/components/ui/game-cta";
import { BrutalCard } from "@/components/ui/brutal-card";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { Container } from "@/components/ui/container";
import { REFERRAL } from "@/lib/messaging";
import { contributeLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(contributeLink);

export default function ContributePage() {
  return (
    <div>
      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <SectionHeader
            title="Contribute"
            subtitle="Four useful ways to help: vote, fund, code, or feed the machine real data."
            size="lg"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BrutalCard bgColor="pink" shadowSize={8} padding="lg" hover>
              <h3 className="text-2xl font-black uppercase text-foreground mb-3">
                Play the Game
              </h3>
              <p className="text-lg font-bold text-foreground mb-4">
                Vote on the 1% Treaty. Share your link. {REFERRAL.earnOne} Free. Thirty seconds.
              </p>
              <GameCTA href="/#vote" variant="secondary">
                Play Now
              </GameCTA>
            </BrutalCard>
            <BrutalCard bgColor="cyan" shadowSize={8} padding="lg" hover>
              <h3 className="text-2xl font-black uppercase text-foreground mb-3">
                Deposit
              </h3>
              <p className="text-lg font-bold text-foreground mb-4">
                Most investing is gambling in a suit. This one funds the campaign. Plan works? VOTE holders split the pool. Plan fails? Projected 11x return from VC-sector diversification. Projections, not guarantees.
              </p>
              <GameCTA href={ROUTES.prize} variant="secondary">
                Insert Coin
              </GameCTA>
            </BrutalCard>
            <BrutalCard bgColor="yellow" shadowSize={8} padding="lg" hover>
              <h3 className="text-2xl font-black uppercase text-foreground mb-3">
                Code
              </h3>
              <p className="text-lg font-bold text-foreground mb-4">
                Humanity built TikTok and a website where people argue about sandwiches. This is a TypeScript monorepo that might help prevent extinction. Fifteen packages. Open source.
              </p>
              <GameCTA href="https://github.com/mikepsinn/optimitron" variant="secondary">
                GitHub
              </GameCTA>
            </BrutalCard>
            <BrutalCard bgColor="background" shadowSize={8} padding="lg" hover>
              <h3 className="text-2xl font-black uppercase text-foreground mb-3">
                Data
              </h3>
              <p className="text-lg font-bold text-foreground mb-4">
                You are a meat robot with 37 trillion cells breaking in 7,000 different ways. Track what you put in it. The dFDA can learn what is actually working.
              </p>
              <GameCTA href={ROUTES.transmit} variant="secondary">
                Transmit Data
              </GameCTA>
            </BrutalCard>
          </div>
        </Container>
      </SectionContainer>
    </div>
  );
}
