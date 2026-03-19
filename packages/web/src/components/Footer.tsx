import Link from "next/link";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  ROUTES,
  communityLinks,
  exploreLinks,
  footerAppLinks,
  githubLink,
  paperLinks,
} from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="border-t-4 border-primary bg-brutal-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={ROUTES.home} className="text-xl font-black uppercase text-foreground">
              ⚡ Optimitron
            </Link>
            <p className="text-sm text-foreground mt-3 leading-relaxed font-bold">
              Planetary debugging software. Because your species keeps ignoring
              its own data.
            </p>
          </div>

          {/* App */}
          <div>
            <h4 className="text-sm font-black uppercase mb-3 text-foreground">
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
            <h4 className="text-sm font-black uppercase mb-3 text-foreground">
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
            <h4 className="text-sm font-black uppercase mb-3 text-foreground">
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
            <h4 className="text-sm font-black uppercase mb-3 text-foreground">
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

        <div className="mt-12 pt-8 border-t-2 border-primary text-center text-sm text-foreground font-bold">
          <p>
            None of this is financial advice. Obviously. Please direct all
            complaints to{" "}
            <a
              href="https://mikesinn.com"
              className="text-foreground font-bold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mike P. Sinn
            </a>
            , who insists on trying to fix your planet despite overwhelming
            evidence that it doesn&apos;t want to be fixed.{" "}
            <NavItemLink
              item={githubLink}
              variant="custom"
              external
              className="text-foreground font-bold hover:underline"
            >
              Source code
            </NavItemLink>{" "}
            available for inspection, not that any of you will read it.
          </p>
        </div>
      </div>
    </footer>
  );
}
