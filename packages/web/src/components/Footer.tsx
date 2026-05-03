import Link from "next/link";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { getSiteVariantUiConfig } from "@/config/site-variant-ui";
import { ROUTES } from "@/lib/routes";
import { getSiteConfig, type SiteKey } from "@/lib/site";

interface FooterProps {
  siteKey?: SiteKey;
}

export default function Footer({ siteKey = "optimitron" }: FooterProps) {
  const site = getSiteConfig(siteKey);
  const config = getSiteVariantUiConfig(siteKey).footer;

  return (
    <footer className="border-t-2 border-foreground bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={config.brandHref} className="text-lg font-black uppercase tracking-tight transition-colors hover:text-muted-foreground">
              {config.brandLabel}
            </Link>
            <p className="mt-3 text-sm font-bold leading-relaxed text-muted-foreground">
              {config.brandDescription}
            </p>
          </div>

          {config.columns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-foreground">
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.items.map((link) => (
                  <li key={link.href}>
                    <NavItemLink
                      item={link}
                      variant="footer"
                      external={link.external}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm font-bold text-muted-foreground">
          {config.bottomText || config.sourceLink ? (
            <p>
              {config.bottomText}
              {config.sourceLink ? (
                <>
                  {" "}
                  <NavItemLink
                    item={config.sourceLink}
                    variant="custom"
                    external
                    className="font-bold text-foreground hover:underline"
                  >
                    Source code
                  </NavItemLink>{" "}
                  open for inspection by any sufficiently curious primate.
                </>
              ) : null}
            </p>
          ) : null}
          <p className="text-xs">
            {site.organizationName}. Contact{" "}
            <a href={`mailto:${site.publicContactEmail}`} className="underline hover:no-underline">
              {site.publicContactEmail}
            </a>
            .
          </p>
          <nav
            aria-label="Legal"
            className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs"
          >
            <Link href={ROUTES.privacy} className="underline hover:no-underline">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link href={ROUTES.terms} className="underline hover:no-underline">
              Terms
            </Link>
            <span aria-hidden="true">·</span>
            <Link href={ROUTES.legal} className="underline hover:no-underline">
              Legal
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
