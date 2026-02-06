"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/preferences", label: "Preferences" },
  { href: "/politicians", label: "Politicians" },
  { href: "/import", label: "Import" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"
            >
              Optomitron
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                    pathname === link.href
                      ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            >
              GitHub ↗
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                  pathname === link.href
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/mikepsinn/optomitron"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
