"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import type { ReferendumSiteContent } from "@/content/referendum-sites";
import type { SiteConfig } from "@/lib/site";

export function ReferendumSiteNavbar({
  config,
  content,
}: {
  config: SiteConfig;
  content: ReferendumSiteContent;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-xl font-black uppercase tracking-tight text-foreground [font-family:var(--v0-font-libre-baskerville)]"
        >
          {config.shortName}
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {content.navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm font-bold uppercase tracking-wide text-foreground hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label="Toggle menu"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open ? (
        <ul className="flex flex-col gap-4 border-t-2 border-foreground bg-background px-4 py-4 md:hidden">
          {content.navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block text-base font-bold uppercase tracking-wide text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
