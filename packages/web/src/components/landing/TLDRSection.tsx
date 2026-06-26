import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import { CTA } from "@/lib/messaging";

export function TLDRSection() {
  return (
    <SectionContainer bgColor="pink" borderPosition="bottom" padding="lg">
      <Container className="max-w-4xl">
        <SectionHeader
          title="How Do You Play?"
          subtitle="It's embarrassingly easy."
          size="lg"
        />

        <div className="space-y-6 text-center">
          {/* The two steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-6xl font-black text-foreground mb-2">1</div>
              <p className="text-xl sm:text-2xl font-black uppercase text-foreground">
                Click 2 Buttons
              </p>
              <p className="text-lg font-bold text-muted-foreground mt-2">
                Prove you are human. Vote. 30 seconds. A rock cannot do this. You can.
              </p>
            </div>
            <div className="p-6 border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-6xl font-black text-foreground mb-2">2</div>
              <p className="text-xl sm:text-2xl font-black uppercase text-foreground">
                Tell Your Friends
              </p>
              <p className="text-lg font-bold text-muted-foreground mt-2">
                They click 2 buttons. Then they tell their friends. That's how 8 billion people vote.
              </p>
            </div>
          </div>

          {/* The punchline */}
          <div className="p-6 border-4 border-primary bg-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl sm:text-2xl font-black text-background leading-relaxed">
              That&apos;s it. You&apos;re done. 99% of you don&apos;t need to
              know anything else.
            </p>
            <p className="text-lg font-bold text-background mt-3">
              The rest of this site is the instruction manual. Read it if
              you&apos;re into ending war and disease. But for the love of your
              species, click the buttons first.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-2">
            <GameCTA href="#vote" variant="primary" size="lg">
              {CTA.playNow}
            </GameCTA>
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}
