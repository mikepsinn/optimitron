"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { PersonhoodStatusBadge } from "@/components/personhood/PersonhoodStatusBadge";
import type { PersonhoodProviderValue } from "@/lib/personhood";

const exploreLinks = [
  { href: "/outcomes", label: "Outcome Hubs" },
  { href: "/budget", label: "Optimal Budget" },
  { href: "/policies", label: "Optimal Policies" },
  { href: "/misconceptions", label: "Myth vs Data" },
  { href: "/compare", label: "Compare Countries" },
];

const topLinks = [
  { href: "/vote", label: "Wishocracy" },
  { href: "/about", label: "About" },
];

const allLinks = [...exploreLinks, ...topLinks];

function AccountLinks({
  isAuthenticated,
  accountLabel,
  personhoodProvider,
  personhoodVerified,
}: {
  isAuthenticated: boolean;
  accountLabel: string | null;
  personhoodProvider: PersonhoodProviderValue | null;
  personhoodVerified: boolean;
}) {
  if (isAuthenticated) {
    return (
      <>
        <Link
          href="/vote"
          className="text-sm font-bold px-4 py-2 border-2 border-black bg-yellow-300 hover:bg-yellow-400 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          My Allocations
        </Link>
        <span className="hidden lg:block text-xs font-bold uppercase text-muted-foreground">
          {accountLabel}
        </span>
        <div className="hidden lg:block">
          <PersonhoodStatusBadge
            provider={personhoodProvider}
            verified={personhoodVerified}
          />
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm font-bold px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          Sign Out
        </button>
      </>
    );
  }

  return (
    <Link
      href="/auth/signin?callbackUrl=%2Fvote"
      className="text-sm font-bold px-4 py-2 border-2 border-black bg-brutal-cyan hover:bg-brutal-cyan/80 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
    >
      Sign In
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

  const isActive = exploreLinks.some((l) => pathname === l.href);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`text-sm font-bold uppercase px-3 py-2 border-2 transition-all flex items-center gap-1 ${
          isActive
            ? "border-black bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            : "border-transparent text-black hover:border-black hover:bg-cyan-200 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
        <div className="absolute top-full left-0 mt-1 w-56 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
          {exploreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block text-sm font-bold px-4 py-3 transition-colors ${
                pathname === link.href
                  ? "bg-yellow-300 text-black"
                  : "text-black hover:bg-cyan-200"
              }`}
            >
              {link.label}
            </Link>
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
  const accountLabel =
    session?.user?.name ??
    session?.user?.email ??
    session?.user?.username ??
    null;

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-black bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-black uppercase tracking-tight text-black transition-colors hover:text-pink-500"
            >
              ⚡ Optomitron
            </Link>
            <div className="hidden items-center gap-1 md:flex">
              <ExploreDropdown pathname={pathname} />
              {topLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-bold uppercase px-3 py-2 border-2 transition-all ${
                    pathname === link.href
                      ? "border-black bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "border-transparent text-black hover:border-black hover:bg-cyan-200 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <AccountLinks
              isAuthenticated={isAuthenticated}
              accountLabel={accountLabel}
              personhoodProvider={session?.user?.personhoodProvider ?? null}
              personhoodVerified={Boolean(session?.user?.personhoodVerified)}
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="border-2 border-black p-2 transition-colors hover:bg-yellow-300 md:hidden"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t-4 border-black bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            <div className="text-xs font-bold uppercase text-gray-400 px-3 py-1">
              Explore
            </div>
            {exploreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-bold uppercase px-3 py-2 border-2 transition-all ${
                  pathname === link.href
                    ? "border-black bg-yellow-300 text-black"
                    : "border-transparent text-black hover:border-black hover:bg-cyan-200"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t-2 border-gray-200 my-2" />
            {topLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-bold uppercase px-3 py-2 border-2 transition-all ${
                  pathname === link.href
                    ? "border-black bg-yellow-300 text-black"
                    : "border-transparent text-black hover:border-black hover:bg-cyan-200"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t-2 border-gray-200 my-2" />
            <Link
              href={
                isAuthenticated
                  ? "/vote"
                  : "/auth/signin?callbackUrl=%2Fvote"
              }
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold px-3 py-2 border-2 border-black bg-brutal-cyan"
            >
              {isAuthenticated ? "My Allocations" : "Sign In"}
            </Link>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="block w-full text-left text-sm font-bold px-3 py-2 border-2 border-black"
              >
                Sign Out
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
