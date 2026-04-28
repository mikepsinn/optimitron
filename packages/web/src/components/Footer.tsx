import Link from "next/link";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { getSiteConfig } from "@/lib/site";
import {
  ROUTES,
  communityLinks,
  exploreLinks,
  footerAppLinks,
  githubLink,
  paperLinks,
} from "@/lib/routes";

export default function Footer() {
  const site = getSiteConfig("optimitron");

  return (
    <footer className="border-t-2 border-foreground bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={ROUTES.home} className="text-lg font-black uppercase tracking-tight transition-colors hover:text-muted-foreground">
              ⚡ Optimitron
            </Link>
            <p className="mt-3 text-sm font-bold leading-relaxed text-muted-foreground">
              The Earth Optimization Machine.
            </p>
          </div>

          {/* App */}
          <div>
            <h4 className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-foreground">
              App
            </h4>
            <ul className="space-y-2">
              {footerAppLinks.map((link) => (
                <li key={link.href}>
                  <NavItemLink item={link} variant="footer" />
                </li>
              ))}
            </ul>
          </div>

          {/* Analysis */}
          <div>
            <h4 className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-foreground">
              Analysis
            </h4>
            <ul className="space-y-2">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <NavItemLink item={link} variant="footer" />
                </li>
              ))}
            </ul>
          </div>

          {/* Papers */}
          <div>
            <h4 className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-foreground">
              Papers
            </h4>
            <ul className="space-y-2">
              {paperLinks.map((link) => (
                <li key={link.href}>
                  <NavItemLink item={link} variant="footer" external />
                </li>
              ))}
            </ul>
          </div>

          {/* Open Source */}
          <div>
            <h4 className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-foreground">
              Open Source
            </h4>
            <ul className="space-y-2">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <NavItemLink item={link} variant="footer" external />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm font-bold text-muted-foreground">
          <p>
            © 4237 Wishonia. All rights reserved in this and 6,412 adjacent
            timelines. Unauthorized reproduction of the general welfare is
            encouraged and, frankly, overdue.{" "}
            <NavItemLink
              item={githubLink}
              variant="custom"
              external
              className="font-bold text-foreground hover:underline"
            >
              Source code
            </NavItemLink>{" "}
            open for inspection by any sufficiently curious primate.
          </p>
          <p className="mt-3 text-xs">
            Published by {site.organizationName}. Contact{" "}
            <a href={`mailto:${site.publicContactEmail}`} className="underline hover:no-underline">
              {site.publicContactEmail}
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
