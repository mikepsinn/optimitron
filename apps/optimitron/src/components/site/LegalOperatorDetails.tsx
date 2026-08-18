import { formatSiteMailingAddress, type SiteConfig } from "@/lib/site";

export function LegalOperatorDetails({ site }: { site: SiteConfig }) {
  const websiteLabel = new URL(site.canonicalOrigin).hostname;

  return (
    <div className="mt-4 border border-foreground bg-background p-4 text-foreground">
      <p className="font-black">{site.legalEntityName}</p>
      <p className="font-bold">{site.legalEntityType}</p>
      <p className="mt-3 font-bold leading-relaxed">
        {site.businessDescription}
      </p>
      <address className="mt-3 font-bold not-italic">
        Mailing address: {formatSiteMailingAddress(site.mailingAddress)}
      </address>
      <p className="font-bold">
        Email:{" "}
        <a className="underline" href={`mailto:${site.publicContactEmail}`}>
          {site.publicContactEmail}
        </a>
      </p>
      <p className="font-bold">
        Website:{" "}
        <a className="underline" href={site.canonicalOrigin}>
          {websiteLabel}
        </a>
      </p>
    </div>
  );
}
