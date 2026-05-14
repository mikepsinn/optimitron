import Link from "next/link";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { getSiteVariantUiConfig } from "@/config/site-variant-ui";
import { ROUTES } from "@/lib/routes";
import { getSiteConfig, type SiteFooterColumn, type SiteKey } from "@/lib/site";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";

interface FooterProps {
  siteKey?: SiteKey;
}

function FooterColumnLinks({ column }: { column: SiteFooterColumn }) {
  return (
    <ul className="space-y-2">
      {column.items.map((link) => (
        <li key={link.href}>
          <NavItemLink item={link} variant="footer" external={link.external}>
            {link.label}
          </NavItemLink>
        </li>
      ))}
    </ul>
  );
}

function FooterBrandDescription({
  description,
  siteKey,
}: {
  description: string;
  siteKey: SiteKey;
}) {
  if (siteKey !== "warOnDisease") {
    return <>{description}</>;
  }

  return (
    <>
      Let's trade one apocalypse out of humanity's{" "}
      <ParameterValue
        className="font-black text-foreground"
        display="integer"
        param={NUCLEAR_WINTER_OVERKILL_FACTOR}
      />
      -apocalypse mass-murder capacity for disease eradication in{" "}
      <ParameterValue
        className="font-black text-foreground"
        display="integer"
        param={DFDA_QUEUE_CLEARANCE_YEARS}
      />{" "}
      years instead of{" "}
      <ParameterValue
        className="font-black text-foreground"
        display="integer"
        param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
      />
      .
    </>
  );
}

export default function Footer({ siteKey = "optimitron" }: FooterProps) {
  const site = getSiteConfig(siteKey);
  const config = getSiteVariantUiConfig(siteKey).footer;
  const year = new Date().getFullYear();
  const bottomText =
    config.bottomText.trim().length > 0
      ? config.bottomText.replaceAll("{year}", String(year))
      : `\u00a9 ${year} ${site.organizationName}.`;

  return (
    <footer className="border-t-2 border-foreground bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href={config.brandHref}
              className="text-lg font-black uppercase tracking-tight transition-colors hover:text-muted-foreground"
            >
              {config.brandLabel}
            </Link>
            <div className="mt-3 text-sm font-bold leading-relaxed text-muted-foreground">
              <FooterBrandDescription
                description={config.brandDescription}
                siteKey={siteKey}
              />
            </div>
          </div>

          <div className="space-y-0 sm:hidden">
            {config.columns.map((column) => (
              <details
                className="border-t border-border py-3 last:border-b"
                key={column.title}
              >
                <summary className="cursor-pointer list-none text-xs font-black uppercase tracking-[0.14em] text-foreground [&::-webkit-details-marker]:hidden">
                  {column.title}
                </summary>
                <div className="mt-3">
                  <FooterColumnLinks column={column} />
                </div>
              </details>
            ))}
          </div>

          {config.columns.map((column) => (
            <div className="hidden sm:block" key={column.title}>
              <h4 className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-foreground">
                {column.title}
              </h4>
              <FooterColumnLinks column={column} />
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm font-bold text-muted-foreground">
          <p>{bottomText}</p>
          <p className="mt-2 text-xs">
            Contact{" "}
            <a
              href={`mailto:${site.publicContactEmail}`}
              className="underline hover:no-underline"
            >
              {site.publicContactEmail}
            </a>
            .
          </p>
          <nav
            aria-label="Legal"
            className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs"
          >
            <Link
              href={ROUTES.privacy}
              className="underline hover:no-underline"
            >
              Privacy
            </Link>
            <span aria-hidden="true">{"\u00b7"}</span>
            <Link href={ROUTES.terms} className="underline hover:no-underline">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
