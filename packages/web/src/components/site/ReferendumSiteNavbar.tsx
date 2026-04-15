"use client";

import Link from "next/link";
import type { SiteConfig } from "@/lib/site";

export function ReferendumSiteNavbar({
  config,
}: {
  config: SiteConfig;
}) {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-xl font-black uppercase tracking-tight text-foreground [font-family:var(--v0-font-libre-baskerville)]"
        >
          {config.shortName}
        </Link>
        <Link
          href="/#late-employees"
          className="text-sm font-black uppercase tracking-wide text-foreground hover:underline"
        >
          Tasks
        </Link>
      </nav>
    </header>
  );
}
