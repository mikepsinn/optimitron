"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Menu, Search, User, UserPlus } from "lucide-react";
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
import { getSiteVariantUiConfig, type SiteNavConfig } from "@/config/site-variant-ui";
import {
  ROUTES,
  getSignInPath,
  isNavItemActive,
  profileLink,
  searchLink,
  settingsLink,
  type NavItem,
} from "@/lib/routes";

function getNavItemAriaLabel(item: NavItem): string {
  return item.description ? `${item.label}: ${item.description}` : item.label;
}

function AvatarButton({
  callbackUrl,
  user,
  isAuthenticated,
}: {
  callbackUrl: string;
  user: {
    name?: string | null;
    email?: string | null;
    username?: string | null;
  } | null;
  isAuthenticated: boolean;
}) {
  const initial = user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? null;
  const href = isAuthenticated ? ROUTES.dashboard : getSignInPath(callbackUrl);
  const label = isAuthenticated ? "Open Dashboard" : "Sign In";

  return (
    <Link
      href={href}
      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-background text-foreground transition-colors hover:bg-muted"
      title={label}
      aria-label={label}
    >
      {initial ? (
        <span className="text-sm font-black uppercase">{initial}</span>
      ) : (
        <User className="h-4 w-4 stroke-[2.5px]" />
      )}
    </Link>
  );
}

interface NavbarProps {
  config?: SiteNavConfig;
}

const defaultNavConfig = getSiteVariantUiConfig("optimitron").nav;

export default function Navbar({ config = defaultNavConfig }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const isAuthenticated = status === "authenticated";
  const user = session?.user ?? null;
  const quickAction = config.quickAction ?? null;
  const quickActionHref = quickAction
    ? isAuthenticated
      ? quickAction.href
      : getSignInPath(quickAction.href)
    : null;
  const normalizedNavQuery = navQuery.trim().toLowerCase();
  const fullSearchHref = normalizedNavQuery
    ? `${searchLink.href}?q=${encodeURIComponent(navQuery.trim())}`
    : searchLink.href;
  const filteredSections = config.sections
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
    <nav className="sticky top-0 z-50 border-b-2 border-foreground bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[58px] items-center justify-between">
          {/* Logo */}
          <Link
            href={config.brandHref}
            className="text-lg font-black uppercase tracking-tight text-foreground transition-colors hover:text-muted-foreground"
          >
            <span className="sm:hidden">{config.brandLabel}</span>
            <span className="hidden sm:inline">{config.desktopBrandLabel}</span>
          </Link>

          {/* Right side: Avatar + Hamburger */}
          <div className="flex items-center gap-3">
            {config.searchEnabled ? (
              <Link
                href={searchLink.href}
                className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                title={searchLink.label}
                aria-label={searchLink.label}
              >
                <Search className="h-4 w-4 stroke-[2.5px]" />
              </Link>
            ) : null}
            {quickAction && quickActionHref ? (
              <Link
                href={quickActionHref}
                className="inline-flex h-9 items-center justify-center gap-2 border-2 border-foreground bg-foreground px-2.5 text-xs font-black uppercase tracking-[0.12em] text-background transition-colors hover:bg-background hover:text-foreground sm:px-3"
                title={quickAction.description}
                aria-label={getNavItemAriaLabel(quickAction)}
              >
                <UserPlus className="h-4 w-4 stroke-[2.5px]" />
                <span className="hidden sm:inline">{quickAction.cta}</span>
              </Link>
            ) : null}
            <AvatarButton
              callbackUrl={config.signInCallbackUrl}
              user={user}
              isAuthenticated={isAuthenticated}
            />

            {config.menuEnabled ? (
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
                    className="inline-flex h-9 w-9 items-center justify-center border-2 border-foreground bg-background text-foreground transition-colors hover:bg-muted"
                    aria-label="Open menu"
                  >
                    <Menu className="h-4 w-4 stroke-[3px]" />
                  </button>
                </SheetTrigger>

              <SheetContent
                side="right"
                appearance="minimal"
                className="w-[min(calc(100vw-1.5rem),24rem)] overflow-y-auto sm:max-w-sm"
              >
                <SheetTitle className="mb-4 border-b-2 border-foreground pb-3 pr-10 text-lg font-black uppercase tracking-tight">
                  {config.menuTitle}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Site navigation menu
                </SheetDescription>

                {config.searchEnabled ? (
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
                        className="h-10 border-2 border-foreground bg-background pl-10 text-sm font-bold shadow-none"
                        onChange={(event) => setNavQuery(event.target.value)}
                        placeholder="Filter or search"
                        type="search"
                        value={navQuery}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full border-2 border-foreground bg-foreground px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-background transition-colors hover:bg-background hover:text-foreground"
                    >
                      {normalizedNavQuery ? `Search "${navQuery.trim()}"` : "Open Full Search"}
                    </button>
                  </form>
                ) : null}

                {primarySections.length > 0 ? (
                  <div
                    className={`flex flex-col ${
                      collapsedSections.length > 0
                        ? "mb-3 border-b border-border pb-3"
                        : ""
                    }`}
                  >
                    {primarySections.flatMap((section) =>
                      section.items.map((item) => {
                        const active = isNavItemActive(pathname, item);
                        const ariaLabel = getNavItemAriaLabel(item);
                        const linkClass = `flex items-center gap-3 px-3 py-3 min-h-[48px] text-base font-black uppercase transition-colors ${
                          active
                            ? "bg-muted text-foreground"
                            : "text-foreground hover:bg-muted"
                        }`;

                        if (item.external) {
                          return (
                            <SheetClose asChild key={item.href}>
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={linkClass}
                                title={item.description}
                                aria-label={ariaLabel}
                              >
                                {item.emoji && <span className="text-base">{item.emoji}</span>}
                                {item.label}
                              </a>
                            </SheetClose>
                          );
                        }

                        return (
                          <SheetClose asChild key={item.href}>
                            <Link
                              href={item.href}
                              className={linkClass}
                              title={item.description}
                              aria-label={ariaLabel}
                            >
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
                      <Accordion.Header className="py-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:no-underline">
                        {section.label}
                      </Accordion.Header>
                      <Accordion.Content unstyled>
                        <div className="flex flex-col">
                          {section.items.map((item) => {
                            const active = isNavItemActive(pathname, item);
                            const ariaLabel = getNavItemAriaLabel(item);
                            const linkClass = `flex items-center gap-3 px-3 py-3 min-h-[44px] text-sm font-bold uppercase transition-colors ${
                              active
                                ? "bg-muted text-foreground"
                                : "text-foreground hover:bg-muted"
                            }`;

                            if (item.external) {
                              return (
                                <SheetClose asChild key={item.href}>
                                  <a
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={linkClass}
                                    title={item.description}
                                    aria-label={ariaLabel}
                                  >
                                    {item.emoji && <span className="text-base">{item.emoji}</span>}
                                    {item.label}
                                  </a>
                                </SheetClose>
                              );
                            }

                            return (
                              <SheetClose asChild key={item.href}>
                                <Link
                                  href={item.href}
                                  className={linkClass}
                                  title={item.description}
                                  aria-label={ariaLabel}
                                >
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
                  <div className="mt-4 border-2 border-foreground bg-background px-4 py-3 text-sm font-bold text-foreground">
                    No menu matches for &quot;{navQuery.trim()}&quot;. Use full search instead.
                  </div>
                ) : null}

                {/* Auth section */}
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  {isAuthenticated ? (
                    <>
                      <SheetClose asChild>
                        <Link
                          href={profileLink.href}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase transition-colors hover:bg-muted"
                          title={profileLink.description}
                          aria-label={`${profileLink.label}: ${profileLink.description}`}
                        >
                          {profileLink.emoji} {profileLink.label}
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href={settingsLink.href}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase transition-colors hover:bg-muted"
                          title={settingsLink.description}
                          aria-label={`${settingsLink.label}: ${settingsLink.description}`}
                        >
                          {settingsLink.emoji} {settingsLink.label}
                        </Link>
                      </SheetClose>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          void signOut({ callbackUrl: ROUTES.home });
                        }}
                        className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm font-black uppercase transition-colors hover:bg-muted"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <SheetClose asChild>
                      <Link
                        href={getSignInPath(config.signInCallbackUrl)}
                        className="block border-2 border-foreground bg-foreground px-3 py-2 text-center text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
                      >
                        Sign In
                      </Link>
                    </SheetClose>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
