import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { TAGLINES, CTA } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";
import {
  treatyPrimaryButtonClass,
  treatySecondaryButtonClass,
} from "@/components/landing/TreatyFlowShell";

export function HeroSection({
  earthOptimizationServices = false,
}: {
  earthOptimizationServices?: boolean;
}) {
  return (
    <SectionContainer
      bgColor="background"
      borderPosition="bottom"
      className="bg-[var(--treaty-paper)] text-[var(--treaty-ink)]"
      padding="sm"
    >
      <Container className="py-10 sm:py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center [font-family:var(--v0-font-libre-baskerville)]">
          {earthOptimizationServices ? (
            <p className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--treaty-ink-soft)] sm:text-sm">
              Earth Optimization Services
            </p>
          ) : null}
          <h1 className="text-4xl font-black uppercase leading-tight text-[var(--treaty-ink)] sm:text-6xl md:text-7xl">
            {earthOptimizationServices ? (
              <>
                <span className="block">The Earth</span>
                <span className="block">Optimization Machine</span>
              </>
            ) : (
              <>
                <span className="block">Play the</span>
                <span className="block">Earth Optimization</span>
                <span className="block">Game!</span>
              </>
            )}
          </h1>

          <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-[var(--treaty-ink-soft)] sm:text-2xl sm:leading-10">
            {earthOptimizationServices
              ? "Earth Optimization Services operates Optimitron: it calculates the laws, budgets, treatments, and next actions most likely to make the median human healthier and wealthier—then helps people get them done."
              : TAGLINES.gameObjective}
          </p>

          <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
            <Link
              href="#vote"
              className={`${treatyPrimaryButtonClass} inline-flex items-center`}
            >
              {CTA.playNow}
            </Link>
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
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}
