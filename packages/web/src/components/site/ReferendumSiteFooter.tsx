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
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-xs font-bold text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p className="uppercase tracking-wide">
          {config.name} — {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-4">
          <Link href="/legal" className="hover:underline">
            Legal
          </Link>
          <Link href="/why" className="hover:underline">
            Why
          </Link>
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
