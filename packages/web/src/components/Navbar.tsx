"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Menu, User, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Accordion } from "@/components/retroui/Accordion";
import {
  ROUTES,
  getSignInPath,
  isNavItemActive,
  navSections,
  profileLink,
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

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center justify-center w-10 h-10 border-4 border-primary bg-background text-foreground hover:bg-foreground hover:text-background font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all rounded-full"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-5 w-5 stroke-[3px]" /> : <Moon className="h-5 w-5 stroke-[3px]" />}
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const isAuthenticated = status === "authenticated";
  const user = session?.user ?? null;

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

          {/* Right side: Theme toggle + Avatar + Hamburger */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AvatarButton user={user} isAuthenticated={isAuthenticated} />

            <Sheet open={open} onOpenChange={setOpen}>
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

                <Accordion type="multiple" defaultValue={navSections.map((s) => s.id)} className="w-full">
                  {navSections.map((section) => (
                    <Accordion.Item key={section.id} value={section.id} className="!border-0 !bg-transparent !shadow-none !rounded-none">
                      <Accordion.Header className="text-xs font-black uppercase tracking-widest py-3 text-brutal-yellow-foreground/60 hover:no-underline">
                        {section.label}
                      </Accordion.Header>
                      <Accordion.Content unstyled>
                        <div className="flex flex-col">
                          {section.items.map((item) => {
                            const active = isNavItemActive(pathname, item);
                            return (
                              <SheetClose asChild key={item.href}>
                                <Link
                                  href={item.href}
                                  className={`flex items-center gap-3 px-3 py-3 min-h-[44px] text-sm font-bold uppercase transition-colors rounded-md ${
                                    active
                                      ? "bg-background/40 text-brutal-yellow-foreground"
                                      : "hover:bg-background/30"
                                  }`}
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
