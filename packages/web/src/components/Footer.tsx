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
    <footer className="border-t-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={ROUTES.home} className="text-xl font-black uppercase">
              ⚡ Optimitron
            </Link>
            <p className="text-sm mt-3 leading-relaxed font-bold">
              The Earth Optimization Machine.
            </p>
          </div>

          {/* App */}
          <div>
            <h4 className="text-sm font-black uppercase mb-3">
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
            <h4 className="text-sm font-black uppercase mb-3">
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
            <h4 className="text-sm font-black uppercase mb-3">
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
            <h4 className="text-sm font-black uppercase mb-3">
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

        <div className="mt-12 pt-8 border-t-2 border-primary text-center text-sm font-bold">
          <p>
            © 4237 Wishonia. All rights reserved in this and 6,412 adjacent
            timelines. Unauthorized reproduction of the general welfare is
            encouraged and, frankly, overdue.{" "}
            <NavItemLink
              item={githubLink}
              variant="custom"
              external
              className="font-bold hover:underline"
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
