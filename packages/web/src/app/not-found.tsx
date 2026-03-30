import Link from "next/link";
import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { BrutalCard } from "@/components/ui/brutal-card";
import { GameCTA } from "@/components/ui/game-cta";

export default function NotFound() {
  return (
    <SectionContainer bgColor="background" borderPosition="none" padding="lg">
      <Container size="md">
        <div className="flex flex-col items-center text-center gap-12 py-12">
          {/* Giant 404 */}
          <div className="relative">
            <h1 className="text-[8rem] sm:text-[12rem] md:text-[16rem] font-black uppercase leading-none tracking-tighter text-brutal-pink">
              404
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-4 bg-foreground" />
          </div>

          {/* Wishonia's commentary */}
          <BrutalCard bgColor="cyan" shadowSize={12} padding="lg">
            <div className="max-w-2xl space-y-6 text-left">
              <p className="text-xl sm:text-2xl font-black uppercase">
                Page Not Found
              </p>
              <p className="text-lg font-bold">
                Fascinating. You&apos;ve managed to navigate to a page that
                doesn&apos;t exist. On my planet, our routing infrastructure
                hasn&apos;t lost a page in 4,237 years. You lot can&apos;t even
                keep track of a URL.
              </p>
              <p className="text-lg font-bold">
                To be fair, your species also loses approximately $2.1 trillion
                annually to administrative inefficiency, so misplacing a web
                page is relatively on-brand.
              </p>
              <p className="text-lg font-bold">
                The page you&apos;re looking for has either been moved,
                deleted, or — and I cannot stress how likely this is — never
                existed in the first place. Much like your evidence-based
                policymaking.
              </p>
            </div>
          </BrutalCard>

          {/* Diagnostic card */}
          <BrutalCard bgColor="yellow" shadowSize={8} padding="md">
            <div className="max-w-xl space-y-3 text-left">
              <p className="text-base font-black uppercase">
                Wishonia Diagnostic Report
              </p>
              <ul className="space-y-2 text-base font-bold">
                <li>
                  <span className="font-black">Problem:</span> Page not found
                </li>
                <li>
                  <span className="font-black">Severity:</span> Mildly
                  embarrassing
                </li>
                <li>
                  <span className="font-black">Root cause:</span> Human error
                  (probability: 97.3%)
                </li>
                <li>
                  <span className="font-black">Recommended action:</span> Click
                  a button that actually goes somewhere
                </li>
                <li>
                  <span className="font-black">Time to resolve on my planet:</span>{" "}
                  0.003 seconds
                </li>
                <li>
                  <span className="font-black">
                    Estimated time on yours:
                  </span>{" "}
                  Unclear. You still haven&apos;t fixed healthcare.
                </li>
              </ul>
            </div>
          </BrutalCard>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <GameCTA href="/" variant="primary" size="lg">
              Return to Earth
            </GameCTA>
            <GameCTA href="/scoreboard" variant="outline" size="lg">
              View Scoreboard
            </GameCTA>
          </div>

          {/* Final quip */}
          <p className="text-muted-foreground font-bold text-base max-w-lg">
            &ldquo;It&apos;s almost impressive how a species that put people on
            the moon regularly types URLs wrong.&rdquo;
            <br />
            <span className="text-sm">— Wishonia, mildly disappointed (as usual)</span>
          </p>
        </div>
      </Container>
    </SectionContainer>
  );
}
