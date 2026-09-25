import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One section of the optimitron.com homepage: a small monospace heading row
 * over a hairline, then the content. Every section uses the same frame so
 * the page reads as one instrument panel instead of a stack of posters.
 */
export function LandingSection({
  children,
  className,
  id,
  note,
  title,
}: {
  children: ReactNode;
  className?: string;
  id: string;
  note?: ReactNode;
  title: ReactNode;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12", className)}
      id={id}
    >
      <div className="flex flex-col gap-1 border-b border-foreground/15 pb-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
        <h2
          className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-foreground"
          id={headingId}
        >
          {title}
        </h2>
        {note ? (
          <p className="text-sm text-muted-foreground sm:text-right">{note}</p>
        ) : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Ruled grid: hairlines between tiles, no boxes, no shadows. */
export function TileGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid border-l border-t border-foreground/15 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Tile({
  children,
  className,
  note,
  title,
}: {
  children: ReactNode;
  className?: string;
  note?: ReactNode;
  title: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col border-b border-r border-foreground/15 p-5 sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-foreground">
          {title}
        </h3>
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** "Read more" style link at the foot of a tile or section. */
export const landingLinkClass =
  "font-mono text-sm font-bold uppercase tracking-[0.1em] text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground";

/** Primary action: a plain black button, matching the site's square corners. */
export const landingButtonClass =
  "inline-flex items-center justify-center border-2 border-foreground bg-foreground px-6 py-3 text-base font-black text-background transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Accent text that meets WCAG AA on both themes. */
export const accentTextClass = "text-brutal-cyan-text";
export const alarmTextClass = "text-brutal-red dark:text-destructive";
