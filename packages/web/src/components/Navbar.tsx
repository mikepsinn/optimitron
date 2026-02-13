"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/outcomes", label: "Outcome Hubs" },
  { href: "/budget", label: "Optimal Budget" },
  { href: "/policies", label: "Optimal Policies" },
  { href: "/misconceptions", label: "Myth vs Data" },
  { href: "/compare", label: "Compare Countries" },
  { href: "/vote", label: "Vote" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b-4 border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-black uppercase tracking-tight text-black hover:text-pink-500 transition-colors"
            >
              ⚡ Optomitron
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
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

          {/* Desktop: GitHub link */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://github.com/mikepsinn/optomitron"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              GitHub ↗
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 border-2 border-black hover:bg-yellow-300 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-4 border-black bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
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
            <a
              href="https://github.com/mikepsinn/optomitron"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-bold px-3 py-2 border-2 border-black hover:bg-black hover:text-white transition-all"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
