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
    <footer className="border-t-2 border-arcade-green bg-background neon-box-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={ROUTES.home} className="text-xs font-black uppercase neon-cyan">
              ▶ OPTIMITRON ◀
            </Link>
            <p className="text-[8px] text-arcade-green mt-3 leading-relaxed font-bold">
              PLANETARY DEBUGGING SOFTWARE. BECAUSE YOUR SPECIES KEEPS IGNORING
              ITS OWN DATA.
            </p>
          </div>

          {/* App */}
          <div>
            <h4 className="text-[9px] font-black uppercase mb-3 text-arcade-yellow">
              ► APP
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
            <h4 className="text-[9px] font-black uppercase mb-3 text-arcade-yellow">
              ► ANALYSIS
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
            <h4 className="text-[9px] font-black uppercase mb-3 text-arcade-yellow">
              ► PAPERS
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
            <h4 className="text-[9px] font-black uppercase mb-3 text-arcade-yellow">
              ► OPEN SOURCE
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

        <div className="mt-12 pt-8 border-t border-arcade-green/50 text-center text-[7px] text-arcade-green font-bold">
          <p>
            NOT FINANCIAL ADVICE. OBVIOUSLY. DIRECT ALL COMPLAINTS TO{" "}
            <a
              href="https://mikesinn.com"
              className="text-arcade-cyan font-bold hover:text-arcade-pink"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIKE P. SINN
            </a>
            , WHO INSISTS ON TRYING TO FIX YOUR PLANET DESPITE OVERWHELMING
            EVIDENCE THAT IT DOESN&apos;T WANT TO BE FIXED.{" "}
            <NavItemLink
              item={githubLink}
              variant="custom"
              external
              className="text-arcade-cyan font-bold hover:text-arcade-pink"
            >
              SOURCE CODE
            </NavItemLink>{" "}
            AVAILABLE FOR INSPECTION. NOT THAT ANY OF YOU WILL READ IT.
          </p>
          <p className="mt-4 text-arcade-pink insert-coin">
            ▶ GAME OVER ▶ INSERT COIN TO CONTINUE ◀
          </p>
        </div>
      </div>
    </footer>
  );
}
