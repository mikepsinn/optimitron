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
    <footer className="border-t-4 border-black mt-24 bg-yellow-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={ROUTES.home} className="text-xl font-black uppercase text-black">
              ⚡ Optomitron
            </Link>
            <p className="text-sm text-black/70 mt-3 leading-relaxed font-medium">
              Earth Optimization Machine for budgets, politicians, and everyday
              tradeoffs.
            </p>
          </div>

          {/* App */}
          <div>
            <h4 className="text-sm font-black uppercase mb-3 text-black">
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
            <h4 className="text-sm font-black uppercase mb-3 text-black">
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
            <h4 className="text-sm font-black uppercase mb-3 text-black">
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
            <h4 className="text-sm font-black uppercase mb-3 text-black">
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

        <div className="mt-12 pt-8 border-t-2 border-black/20 text-center text-sm text-black/70 font-medium">
          <p>
            © {new Date().getFullYear()} Optomitron —{" "}
            <NavItemLink
              item={githubLink}
              variant="custom"
              external
              className="text-black font-bold hover:underline"
            >
              Open source
            </NavItemLink>{" "}
            evidence-based policy analysis by{" "}
            <a
              href="https://mikesinn.com"
              className="text-black font-bold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mike P. Sinn
            </a>
            . MIT Licensed.
          </p>
        </div>
      </div>
    </footer>
  );
}
