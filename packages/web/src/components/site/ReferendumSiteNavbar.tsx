"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/retroui/Avatar";
import { ROUTES, getSignInPath } from "@/lib/routes";
import type { SiteConfig } from "@/lib/site";

export function ReferendumSiteNavbar({
  config,
}: {
  config: SiteConfig;
}) {
  const { data: session, status } = useSession();
  const dashboardHref =
    status === "authenticated" ? ROUTES.dashboard : getSignInPath(ROUTES.dashboard);
  const avatarInitial =
    session?.user?.name?.charAt(0) ?? session?.user?.email?.charAt(0) ?? null;

  return (
    <header className="sticky top-0 z-50 h-[58px] border-b-2 border-foreground bg-background">
      <nav className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-black uppercase tracking-tight text-foreground [font-family:var(--v0-font-libre-baskerville)]"
        >
          {config.shortName}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/#late-employees"
            className="text-sm font-black uppercase tracking-wide text-foreground hover:underline"
          >
            Manage Employees
          </Link>
          <Link
            href={dashboardHref}
            title={status === "authenticated" ? "Dashboard" : "Sign In"}
            aria-label={status === "authenticated" ? "Open dashboard" : "Sign in"}
            className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-foreground bg-brutal-cyan text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-y-[-1px]"
          >
            <Avatar className="h-full w-full border-0 bg-transparent">
              <Avatar.Image
                alt={session?.user?.name ?? "Dashboard"}
                src={session?.user?.image ?? undefined}
              />
              <Avatar.Fallback className="bg-transparent text-xs font-black uppercase text-foreground">
                {avatarInitial ? (
                  avatarInitial
                ) : (
                  <User className="h-4 w-4 stroke-[2.5px]" />
                )}
              </Avatar.Fallback>
            </Avatar>
          </Link>
        </div>
      </nav>
    </header>
  );
}
