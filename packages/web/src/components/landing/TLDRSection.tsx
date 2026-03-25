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
            <div className="p-6 border-2 border-arcade-cyan bg-background neon-box-cyan">
              <div className="text-3xl font-black neon-cyan mb-2">►1◄</div>
              <p className="text-xs sm:text-sm font-black uppercase neon-cyan">
                CLICK 2 BUTTONS
              </p>
              <p className="text-[9px] font-bold text-arcade-green mt-2">
                VERIFY YOU&apos;RE HUMAN. VOTE. 30 SECONDS.
              </p>
            </div>
            <div className="p-6 border-2 border-arcade-pink bg-background neon-box-pink">
              <div className="text-3xl font-black neon-pink mb-2">►2◄</div>
              <p className="text-xs sm:text-sm font-black uppercase neon-pink">
                TELL YOUR FRIENDS
              </p>
              <p className="text-[9px] font-bold text-arcade-green mt-2">
                THEY CLICK 2 BUTTONS. THEY TELL THEIR FRIENDS. DONE.
              </p>
            </div>
          </div>

          {/* The punchline */}
          <div className="p-6 border-2 border-arcade-green bg-background neon-box-green">
            <p className="text-[10px] sm:text-xs font-black neon-green leading-relaxed">
              THAT&apos;S IT. YOU&apos;RE DONE. 99% OF YOU DON&apos;T NEED TO
              KNOW ANYTHING ELSE.
            </p>
            <p className="text-[9px] font-bold text-arcade-yellow mt-3">
              THE REST OF THIS SITE IS THE INSTRUCTION MANUAL. READ IT IF
              YOU&apos;RE INTO ENDING WAR AND DISEASE. BUT FOR THE LOVE OF YOUR
              SPECIES, CLICK THE BUTTONS FIRST.
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
