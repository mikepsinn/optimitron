import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { TAGLINES, CTA } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";
import {
  treatyPrimaryButtonClass,
  treatySecondaryButtonClass,
} from "@/components/landing/TreatyFlowShell";

export interface HeroAction {
  external?: boolean;
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}

const GAME_ACTIONS: HeroAction[] = [
  { href: "#vote", label: CTA.playNow, variant: "primary" },
  { href: ROUTES.declaration, label: "Read Declaration" },
  { href: ROUTES.tasks, label: "Open Top Tasks" },
];

/**
 * Shared hero shell. The game page uses the defaults; other landing pages pass
 * their own eyebrow, headline lines, body, and actions so the markup stays in
 * one place instead of forking per site variant.
 */
export function HeroSection({
  actions = GAME_ACTIONS,
  body = TAGLINES.gameObjective,
  eyebrow,
  headlineLines = ["Play the", "Earth Optimization", "Game!"],
}: {
  actions?: HeroAction[];
  body?: ReactNode;
  eyebrow?: string;
  headlineLines?: string[];
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
          {eyebrow ? (
            <p className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--treaty-ink-soft)] sm:text-sm">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-4xl font-black uppercase leading-tight text-[var(--treaty-ink)] sm:text-6xl md:text-7xl">
            {headlineLines.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-[var(--treaty-ink-soft)] sm:text-2xl sm:leading-10">
            {body}
          </p>

          <div
            className={`mt-8 grid w-full max-w-2xl gap-3 ${
              actions.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            {actions.map((action) => {
              const className = `${
                action.variant === "primary"
                  ? treatyPrimaryButtonClass
                  : treatySecondaryButtonClass
              } inline-flex items-center`;
              return action.external ? (
                <a className={className} href={action.href} key={action.href}>
                  {action.label}
                </a>
              ) : (
                <Link className={className} href={action.href} key={action.href}>
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}
