import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { TAGLINES, CTA } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";
import {
  treatyPrimaryButtonClass,
  treatySecondaryButtonClass,
} from "@/components/landing/TreatyFlowShell";

export function HeroSection() {
  return (
    <SectionContainer
      bgColor="background"
      borderPosition="bottom"
      className="bg-[var(--treaty-paper)] text-[var(--treaty-ink)]"
      padding="sm"
    >
      <Container className="py-10 sm:py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center [font-family:var(--v0-font-libre-baskerville)]">
          <h1 className="text-4xl font-black uppercase leading-tight text-[var(--treaty-ink)] sm:text-6xl md:text-7xl">
            <span className="block">Play the</span>
            <span className="block">Earth Optimization</span>
            <span className="block">Game!</span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-[var(--treaty-ink-soft)] sm:text-2xl sm:leading-10">
            {TAGLINES.gameObjective}
          </p>

          <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
            <Link
              href={ROUTES.declaration}
              className={`${treatySecondaryButtonClass} inline-flex items-center`}
            >
              Read Declaration
            </Link>
            <Link
              href={ROUTES.tasks}
              className={`${treatySecondaryButtonClass} inline-flex items-center`}
            >
              Open Top Tasks
            </Link>
            <Link
              href="#vote"
              className={`${treatyPrimaryButtonClass} inline-flex items-center`}
            >
              {CTA.playNow}
            </Link>
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}
