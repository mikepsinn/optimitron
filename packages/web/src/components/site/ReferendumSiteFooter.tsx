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
        <div className="flex max-w-3xl flex-col items-center gap-3 normal-case">
          <p className="leading-relaxed">
            © 4237 Wishonia. {config.name} filed in the Galactic Registry
            of Embarrassingly Overdue Reforms, shelf 14-C. Earth took 4,237
            years to schedule the meeting. Reproduction of the general
            welfare is encouraged and, at this point, somewhat urgent.
          </p>
          <a
            href="https://optimitron.com"
            className="uppercase tracking-wide hover:underline"
            rel="noreferrer"
          >
            {content.footer.builtByLabel}
          </a>
          <p className="text-[11px] leading-relaxed">
            Published by {config.organizationName}. Contact{" "}
            <a href={`mailto:${config.publicContactEmail}`} className="underline hover:no-underline">
              {config.publicContactEmail}
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
