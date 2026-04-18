"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { User } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Avatar } from "@/components/retroui/Avatar";
import { ROUTES, getSignInPath } from "@/lib/routes";
import type { SiteConfig } from "@/lib/site";

export function ReferendumSiteNavbar({
  config,
}: {
  config: SiteConfig;
}) {
  const { data: session, status } = useSession();
  const avatarInitial =
    session?.user?.name?.charAt(0) ?? session?.user?.email?.charAt(0) ?? null;
  const isAuthed = status === "authenticated";

  const avatarButton = (
    <span
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-foreground bg-brutal-cyan text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-y-[-1px]"
    >
      <Avatar className="h-full w-full border-0 bg-transparent">
        <Avatar.Image
          alt={session?.user?.name ?? "Account"}
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
    </span>
  );

  return (
    <header className="sticky top-0 z-50 h-[58px] border-b-2 border-foreground bg-background">
      <nav className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link
          href={ROUTES.home}
          className="text-xl font-black uppercase tracking-tight text-foreground [font-family:var(--v0-font-libre-baskerville)]"
        >
          {config.shortName}
        </Link>
        <div className="flex items-center gap-3">
          {isAuthed ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger
                aria-label="Open account menu"
                className="focus:outline-none"
              >
                {avatarButton}
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  collisionPadding={16}
                  className="z-50 min-w-[180px] border-2 border-foreground bg-background p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <DropdownMenu.Item asChild className="outline-none">
                    <Link
                      href={ROUTES.dashboard}
                      className="block cursor-pointer px-3 py-2 text-sm font-black uppercase hover:bg-muted focus:bg-muted"
                    >
                      Dashboard
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild className="outline-none">
                    <Link
                      href={ROUTES.profile}
                      className="block cursor-pointer px-3 py-2 text-sm font-black uppercase hover:bg-muted focus:bg-muted"
                    >
                      Profile
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild className="outline-none">
                    <Link
                      href={ROUTES.settings}
                      className="block cursor-pointer px-3 py-2 text-sm font-black uppercase hover:bg-muted focus:bg-muted"
                    >
                      Settings
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => {
                      void signOut({ callbackUrl: ROUTES.home });
                    }}
                    className="block cursor-pointer px-3 py-2 text-sm font-black uppercase text-brutal-red outline-none hover:bg-muted focus:bg-muted"
                  >
                    Sign Out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <Link
              href={getSignInPath(ROUTES.dashboard)}
              title="Sign In"
              aria-label="Sign in"
            >
              {avatarButton}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
