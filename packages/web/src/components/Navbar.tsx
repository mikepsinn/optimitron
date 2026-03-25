"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Menu, User } from "lucide-react";
import { PersonhoodStatusBadge } from "@/components/personhood/PersonhoodStatusBadge";
import type { PersonhoodProviderValue } from "@/lib/personhood";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
    personhoodProvider?: PersonhoodProviderValue | null;
    personhoodVerified?: boolean;
  } | null;
  isAuthenticated: boolean;
}) {
  const initial = user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? null;
  const href = isAuthenticated ? ROUTES.profile : getSignInPath(ROUTES.wishocracy);

  return (
    <Link
      href={href}
      className="flex items-center justify-center w-10 h-10 border-2 border-arcade-cyan bg-background hover:bg-arcade-cyan hover:text-black font-black transition-all neon-box-cyan"
      title={isAuthenticated ? "Profile" : "Sign In"}
    >
      {initial ? (
        <span className="text-xs font-black uppercase">{initial}</span>
      ) : (
        <User className="h-4 w-4 stroke-[3px]" />
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const isAuthenticated = status === "authenticated";
  const user = session?.user ?? null;

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-arcade-green bg-background neon-box-green">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={ROUTES.home}
            className="text-xs sm:text-sm font-black uppercase tracking-wider neon-cyan hover:neon-pink transition-all"
          >
            <span className="sm:hidden">OPTIMITRON</span>
            <span className="hidden sm:inline">▶ OPTIMITRON ◀</span>
          </Link>

          {/* Right side: Avatar + Hamburger */}
          <div className="flex items-center gap-3">
            <AvatarButton user={user} isAuthenticated={isAuthenticated} />

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="border-2 border-arcade-pink bg-background p-2 hover:bg-arcade-pink hover:text-black font-black transition-all neon-box-pink"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4 stroke-[3px]" />
                </button>
              </SheetTrigger>

              <SheetContent side="right" className="overflow-y-auto bg-background border-l-2 border-arcade-green neon-box-green">
                <SheetTitle className="text-sm font-black uppercase tracking-wider border-b-2 border-arcade-cyan pb-3 mb-4 neon-cyan">
                  ▶ SELECT LEVEL ◀
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Site navigation menu
                </SheetDescription>

                <Accordion type="multiple" defaultValue={navSections.map((s) => s.id)} className="w-full">
                  {navSections.map((section) => (
                    <AccordionItem key={section.id} value={section.id} className="border-b border-arcade-green/50">
                      <AccordionTrigger className="text-[10px] font-black uppercase tracking-wider py-3 hover:no-underline text-arcade-yellow hover:text-arcade-pink">
                        ► {section.label}
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="flex flex-col gap-1">
                          {section.items.map((item) => {
                            const active = isNavItemActive(pathname, item);
                            return (
                              <SheetClose asChild key={item.href}>
                                <Link
                                  href={item.href}
                                  className={`flex items-center gap-2 px-3 py-2 text-[9px] font-bold uppercase transition-all border ${
                                    active
                                      ? "border-arcade-cyan bg-arcade-cyan/10 text-arcade-cyan"
                                      : "border-transparent text-arcade-green hover:border-arcade-pink hover:text-arcade-pink"
                                  }`}
                                >
                                  {item.emoji && <span>{item.emoji}</span>}
                                  {item.label}
                                </Link>
                              </SheetClose>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Auth section */}
                <div className="border-t-2 border-arcade-green mt-4 pt-4 space-y-3">
                  {isAuthenticated && user?.personhoodProvider && (
                    <div className="px-1">
                      <PersonhoodStatusBadge
                        provider={user.personhoodProvider as PersonhoodProviderValue}
                        verified={Boolean(user.personhoodVerified)}
                      />
                    </div>
                  )}
                  {isAuthenticated ? (
                    <>
                      <SheetClose asChild>
                        <Link
                          href={profileLink.href}
                          className="block text-[9px] font-black uppercase px-3 py-2 border border-transparent text-arcade-green hover:border-arcade-cyan hover:text-arcade-cyan transition-all"
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
                        className="w-full text-[9px] font-black uppercase px-3 py-2 border-2 border-arcade-red bg-background text-arcade-red hover:bg-arcade-red hover:text-black transition-all neon-box-pink"
                      >
                        ✕ GAME OVER ✕
                      </button>
                    </>
                  ) : (
                    <SheetClose asChild>
                      <Link
                        href={getSignInPath(ROUTES.wishocracy)}
                        className="block text-[9px] font-black uppercase px-3 py-2 border-2 border-arcade-green bg-arcade-green text-black text-center hover:bg-arcade-cyan transition-all insert-coin"
                      >
                        ▶ INSERT COIN ◀
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
