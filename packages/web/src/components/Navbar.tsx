"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Menu, Search, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/retroui/Input";
import { Accordion } from "@/components/retroui/Accordion";
import {
  ROUTES,
  getSignInPath,
  isNavItemActive,
  navSections,
  profileLink,
  searchLink,
} from "@/lib/routes";

function AvatarButton({
  user,
  isAuthenticated,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    username?: string | null;
  } | null;
  isAuthenticated: boolean;
}) {
  const initial = user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? null;
  const href = isAuthenticated ? ROUTES.dashboard : getSignInPath();

  return (
    <Link
      href={href}
      className="flex items-center justify-center w-10 h-10 border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground hover:bg-primary hover:text-primary-foreground font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all rounded-full"
      title={isAuthenticated ? "Profile" : "Sign In"}
    >
      {initial ? (
        <span className="text-lg font-black uppercase">{initial}</span>
      ) : (
        <User className="h-5 w-5 stroke-[3px]" />
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const isAuthenticated = status === "authenticated";
  const user = session?.user ?? null;
  const normalizedNavQuery = navQuery.trim().toLowerCase();
  const fullSearchHref = normalizedNavQuery
    ? `${searchLink.href}?q=${encodeURIComponent(navQuery.trim())}`
    : searchLink.href;
  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!normalizedNavQuery) {
          return true;
        }

        const haystack = [
          section.label,
          item.label,
          item.description,
          item.tagline,
          item.href,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedNavQuery);
      }),
    }))
    .filter((section) => section.items.length > 0);
  const primarySections = filteredSections.filter((section) => section.primary);
  const collapsedSections = filteredSections.filter((section) => !section.primary);
  // When filtering, expand every matching section. Otherwise keep collapsed
  // sections closed so the hamburger menu leads with the core funnel.
  const accordionDefaultValue = normalizedNavQuery
    ? collapsedSections.map((section) => section.id)
    : [];

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={ROUTES.home}
            className="text-xl font-black uppercase tracking-tight"
          >
            <span className="sm:hidden">Optimitron</span>
            <span className="hidden sm:inline">⚡ Optimitron</span>
          </Link>

          {/* Right side: Avatar + Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href={searchLink.href}
              className="inline-flex h-10 w-10 items-center justify-center text-brutal-yellow-foreground/80 transition-colors hover:text-brutal-yellow-foreground"
              title={searchLink.label}
              aria-label={searchLink.label}
            >
              <Search className="h-5 w-5 stroke-[2.5px]" />
            </Link>
            <AvatarButton user={user} isAuthenticated={isAuthenticated} />

            <Sheet
              open={open}
              onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) {
                  setNavQuery("");
                }
              }}
            >
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="border-4 border-primary bg-background text-foreground p-2 hover:bg-foreground hover:text-background font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5 stroke-[3px]" />
                </button>
              </SheetTrigger>

              <SheetContent side="right" className="overflow-y-auto">
                <SheetTitle className="text-xl font-black uppercase tracking-tight border-b-4 border-primary pb-3 mb-4">
                  Navigation
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Site navigation menu
                </SheetDescription>

                <form
                  className="mb-4 space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setOpen(false);
                    router.push(fullSearchHref);
                  }}
                >
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      aria-label="Filter navigation"
                      className="h-11 border-4 border-primary bg-background pl-10 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      onChange={(event) => setNavQuery(event.target.value)}
                      placeholder="Filter nav or search the whole site"
                      type="search"
                      value={navQuery}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full border-4 border-primary bg-brutal-pink px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-brutal-pink-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {normalizedNavQuery ? `Search "${navQuery.trim()}"` : "Open Full Search"}
                  </button>
                </form>

                {primarySections.length > 0 ? (
                  <div className="mb-3 flex flex-col border-b-2 border-brutal-yellow-foreground/20 pb-3">
                    {primarySections.flatMap((section) =>
                      section.items.map((item) => {
                        const active = isNavItemActive(pathname, item);
                        const linkClass = `flex items-center gap-3 px-3 py-3 min-h-[48px] text-base font-black uppercase transition-colors rounded-md ${
                          active
                            ? "bg-background/40 text-brutal-yellow-foreground"
                            : "hover:bg-background/30"
                        }`;

                        if (item.external) {
                          return (
                            <SheetClose asChild key={item.href}>
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={linkClass}
                              >
                                {item.emoji && <span className="text-base">{item.emoji}</span>}
                                {item.label}
                              </a>
                            </SheetClose>
                          );
                        }

                        return (
                          <SheetClose asChild key={item.href}>
                            <Link href={item.href} className={linkClass}>
                              {item.emoji && <span className="text-base">{item.emoji}</span>}
                              {item.label}
                            </Link>
                          </SheetClose>
                        );
                      }),
                    )}
                  </div>
                ) : null}

                <Accordion
                  key={`${normalizedNavQuery}|${collapsedSections.map((section) => section.id).join("|")}`}
                  type="multiple"
                  defaultValue={accordionDefaultValue}
                  className="w-full"
                >
                  {collapsedSections.map((section) => (
                    <Accordion.Item key={section.id} value={section.id} className="!border-0 !bg-transparent !shadow-none !rounded-none">
                      <Accordion.Header className="text-xs font-black uppercase tracking-widest py-3 text-brutal-yellow-foreground/60 hover:no-underline">
                        {section.label}
                      </Accordion.Header>
                      <Accordion.Content unstyled>
                        <div className="flex flex-col">
                          {section.items.map((item) => {
                            const active = isNavItemActive(pathname, item);
                            const linkClass = `flex items-center gap-3 px-3 py-3 min-h-[44px] text-sm font-bold uppercase transition-colors rounded-md ${
                              active
                                ? "bg-background/40 text-brutal-yellow-foreground"
                                : "hover:bg-background/30"
                            }`;

                            if (item.external) {
                              return (
                                <SheetClose asChild key={item.href}>
                                  <a
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={linkClass}
                                  >
                                    {item.emoji && <span className="text-base">{item.emoji}</span>}
                                    {item.label}
                                  </a>
                                </SheetClose>
                              );
                            }

                            return (
                              <SheetClose asChild key={item.href}>
                                <Link href={item.href} className={linkClass}>
                                  {item.emoji && <span className="text-base">{item.emoji}</span>}
                                  {item.label}
                                </Link>
                              </SheetClose>
                            );
                          })}
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  ))}
                </Accordion>

                {normalizedNavQuery && filteredSections.length === 0 ? (
                  <div className="mt-4 border-4 border-primary bg-background px-4 py-3 text-sm font-bold text-foreground">
                    No menu matches for &quot;{navQuery.trim()}&quot;. Use full search instead.
                  </div>
                ) : null}

                {/* Auth section */}
                <div className="border-t border-primary/30 mt-4 pt-4 space-y-2">
                  {isAuthenticated ? (
                    <>
                      <SheetClose asChild>
                        <Link
                          href={profileLink.href}
                          className="flex items-center gap-2 text-sm font-bold uppercase px-3 py-2 border-l-4 border-transparent hover:bg-background/50 transition-colors"
                        >
                          {profileLink.emoji} {profileLink.label}
                        </Link>
                      </SheetClose>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          void signOut({ callbackUrl: ROUTES.home });
                        }}
                        className="w-full text-sm font-black uppercase px-3 py-2 border-2 border-primary bg-background hover:bg-foreground hover:text-background transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <SheetClose asChild>
                      <Link
                        href={getSignInPath(ROUTES.wishocracy)}
                        className="block text-sm font-black uppercase px-3 py-2 border-2 border-primary bg-brutal-cyan text-brutal-cyan-foreground text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                      >
                        Sign In
                      </Link>
                    </SheetClose>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
