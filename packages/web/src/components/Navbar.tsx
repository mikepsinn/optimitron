"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Menu, User, X } from "lucide-react";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { PersonhoodStatusBadge } from "@/components/personhood/PersonhoodStatusBadge";
import type { PersonhoodProviderValue } from "@/lib/personhood";
import {
  ROUTES,
  exploreLinks,
  getSignInPath,
  isNavItemActive,
  profileLink,
  topLinks,
} from "@/lib/routes";

function AvatarButton({
  user,
  isAuthenticated,
}: {
  user: { name?: string | null; email?: string | null; username?: string | null; personhoodProvider?: PersonhoodProviderValue | null; personhoodVerified?: boolean } | null;
  isAuthenticated: boolean;
}) {
  const initial = user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? null;
  const href = isAuthenticated ? ROUTES.profile : getSignInPath(ROUTES.wishocracy);

  return (
    <Link
      href={href}
      className="flex items-center justify-center w-10 h-10 border-4 border-black bg-brutal-cyan hover:bg-primary hover:text-primary-foreground font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all rounded-full"
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

function ExploreDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = exploreLinks.some((link) => isNavItemActive(pathname, link));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`text-sm font-bold uppercase px-3 py-2 border-2 transition-all flex items-center gap-1 ${
          isActive
            ? "border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            : "border-transparent text-black hover:border-black hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        }`}
      >
        Explore
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
          {exploreLinks.map((link) => (
            <NavItemLink
              key={link.href}
              item={link}
              variant="dropdown"
              isActive={isNavItemActive(pathname, link)}
              onClick={() => setOpen(false)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = status === "authenticated";
  const user = session?.user ?? null;

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-black bg-brutal-yellow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={ROUTES.home}
            className="text-xl font-black uppercase tracking-tight text-black hover:underline decoration-4"
          >
            <span className="md:hidden">Optomitron</span>
            <span className="hidden md:inline">⚡ Optomitron</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            <ExploreDropdown pathname={pathname} />
            {topLinks.map((link) => (
              <NavItemLink
                key={link.href}
                item={link}
                variant="topNav"
                isActive={isNavItemActive(pathname, link)}
              />
            ))}
          </div>

          {/* Right side: Avatar + Menu */}
          <div className="flex items-center gap-3">
            {/* Desktop extras */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated && user?.personhoodProvider && (
                <PersonhoodStatusBadge
                  provider={user.personhoodProvider as PersonhoodProviderValue}
                  verified={Boolean(user.personhoodVerified)}
                />
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: ROUTES.home })}
                  className="text-xs font-bold uppercase px-3 py-1.5 border-2 border-black bg-white hover:bg-black hover:text-white transition-all"
                >
                  Sign Out
                </button>
              )}
            </div>

            {/* Avatar */}
            <AvatarButton user={user} isAuthenticated={isAuthenticated} />

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="border-4 border-black bg-white p-2 hover:bg-black hover:text-white font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 stroke-[3px]" />
              ) : (
                <Menu className="h-5 w-5 stroke-[3px]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen ? (
        <div className="border-t-4 border-black bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            <div className="text-xs font-bold uppercase text-muted-foreground px-3 py-1">
              Explore
            </div>
            {exploreLinks.map((link) => (
              <NavItemLink
                key={link.href}
                item={link}
                variant="mobile"
                isActive={isNavItemActive(pathname, link)}
                onClick={() => setMobileMenuOpen(false)}
              />
            ))}
            <div className="border-t-2 border-black/20 my-2" />
            {topLinks.map((link) => (
              <NavItemLink
                key={link.href}
                item={link}
                variant="mobile"
                isActive={isNavItemActive(pathname, link)}
                onClick={() => setMobileMenuOpen(false)}
              />
            ))}
            <div className="border-t-2 border-black/20 my-2" />
            {isAuthenticated ? (
              <>
                <NavItemLink
                  item={profileLink}
                  variant="custom"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-lg font-black uppercase px-3 py-2 hover:text-brutal-pink transition-colors"
                >
                  {profileLink.label}
                </NavItemLink>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void signOut({ callbackUrl: ROUTES.home });
                  }}
                  className="block w-full text-left text-lg font-black uppercase px-3 py-2 hover:text-brutal-pink transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href={getSignInPath(ROUTES.wishocracy)}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-lg font-black uppercase px-3 py-2 border-4 border-black bg-brutal-cyan text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
