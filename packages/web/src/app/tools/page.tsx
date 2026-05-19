import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { GameCTA } from "@/components/ui/game-cta";
import { toolSections, toolsLink, ROUTES } from "@/lib/routes";
import type { NavItem } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(toolsLink);

const sectionColors: Record<string, "cyan" | "yellow" | "pink" | "background"> = {
  analysis: "cyan",
  health: "pink",
  democracy: "yellow",
  finance: "pink",
  transparency: "background",
  player: "cyan",
};

const totalItems = toolSections.reduce((sum, s) => sum + s.items.length, 0);

function ToolCard({ item, color }: { item: NavItem; color: "cyan" | "yellow" | "pink" | "background" }) {
  const inner = (
    <BrutalCard bgColor={color} hover padding="lg" className="h-full">
      <div className="flex items-start justify-between">
        {item.emoji ? <span className="text-3xl">{item.emoji}</span> : null}
        {item.external && (
          <span className="inline-block border border-foreground bg-background px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-foreground">
            External
          </span>
        )}
      </div>
      <h3 className="mt-2 text-lg font-black uppercase text-foreground">
        {item.label}
      </h3>
      {item.tagline && (
        <p className="mt-1 text-sm font-bold text-foreground">
          {item.tagline}
        </p>
      )}
    </BrutalCard>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return (
    <Link href={item.href} className="block">
      {inner}
    </Link>
  );
}

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16 space-y-3">
        <ArcadeTag>{totalItems} Tools</ArcadeTag>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
          The Armory
        </h1>
        <p className="max-w-3xl text-lg font-bold text-muted-foreground">
          Your toolkit for fixing the mess described above. Browse. Equip. Try
          not to break anything important.
        </p>
      </section>

      {/* Tool sections */}
      {toolSections.map((section) => (
        <section key={section.id} className="mb-12">
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-6">
            {section.label}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {section.items.map((item) => (
              <ToolCard
                key={item.href}
                item={item}
                color={sectionColors[section.id] ?? "background"}
              />
            ))}
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="border border-foreground bg-background text-foreground p-8 text-center">
        <h2 className="mb-3 text-2xl font-black uppercase">
          Still Browsing?
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-lg font-bold opacity-80">
          The metrics won&apos;t move themselves.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href={ROUTES.prize} variant="primary" size="lg">
            Play the Game
          </GameCTA>
          <GameCTA href={ROUTES.scoreboard} variant="yellow" size="lg">
            View Scoreboard
          </GameCTA>
        </div>
      </section>
    </div>
  );
}
