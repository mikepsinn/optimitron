import Link from "next/link";
import type { ReferendumSiteContent } from "@/content/referendum-sites";
import type { SiteConfig } from "@/lib/site";

export function ReferendumSiteFooter({
  config,
  content,
}: {
  config: SiteConfig;
  content: ReferendumSiteContent;
}) {
  return (
    <footer className="border-t-2 border-foreground bg-background py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 text-center text-xs font-bold text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {content.navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <p className="uppercase tracking-wide">
            {config.name} — {new Date().getFullYear()}
          </p>
          <a
            href="https://optimitron.com"
            className="hover:underline"
            rel="noreferrer"
          >
            {content.footer.builtByLabel}
          </a>
        </div>
      </div>
    </footer>
  );
}
