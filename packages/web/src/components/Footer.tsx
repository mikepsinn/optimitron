import Link from "next/link";
import type { NavItem } from "@/lib/routes";
import {
  communityLinks,
  exploreLinks,
  footerAppLinks,
  paperLinks,
} from "@/lib/routes";

function FooterLink({ item, external }: { item: NavItem; external?: boolean }) {
  const inner = (
    <span className="group relative inline-block">
      <span>
        {item.emoji && <span className="mr-1">{item.emoji}</span>}
        {item.label}
        {external && " ↗"}
      </span>
      {item.description && (
        <span className="pointer-events-none absolute left-0 bottom-full mb-2 w-52 rounded border-2 border-black bg-white px-3 py-2 text-xs font-medium text-black opacity-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-opacity group-hover:opacity-100 z-10">
          {item.description}
        </span>
      )}
    </span>
  );

  if (external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-black/70 hover:text-black transition-colors"
      >
        {inner}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className="text-sm font-medium text-black/70 hover:text-black transition-colors"
    >
      {inner}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="border-t-4 border-black mt-24 bg-yellow-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="text-xl font-black uppercase text-black">
              ⚡ Optomitron
            </Link>
            <p className="text-sm text-black/70 mt-3 leading-relaxed font-medium">
              Evidence-backed budget priorities, politician alignment, personal
              tracking, and causal studies from real-world outcome data.
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
                  <FooterLink item={link} />
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
                  <FooterLink item={link} />
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
                  <FooterLink item={link} external />
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
                  <FooterLink item={link} external />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-black/20 text-center text-sm text-black/70 font-medium">
          <p>
            © {new Date().getFullYear()} Optomitron —{" "}
            <a
              href="https://github.com/mikepsinn/optomitron"
              className="text-black font-bold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open source
            </a>{" "}
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
