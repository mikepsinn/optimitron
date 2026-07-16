import type { SiteConfig } from "@/lib/site";

function absoluteUrl(origin: string, path: string) {
  const normalizedOrigin = origin.trim().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

export function buildSiteStructuredData(site: SiteConfig) {
  const organizationId = `${site.organizationUrl.replace(/\/+$/, "")}#organization`;
  const websiteId = `${site.canonicalOrigin.replace(/\/+$/, "")}#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: site.organizationName,
        legalName: site.legalEntityName,
        url: site.organizationUrl,
        logo: absoluteUrl(site.organizationUrl, site.organizationLogoPath),
        description: site.businessDescription,
        email: site.publicContactEmail,
        address: {
          "@type": "PostalAddress",
          streetAddress: [site.mailingAddress.line1, site.mailingAddress.line2]
            .filter(Boolean)
            .join(", "),
          addressLocality: site.mailingAddress.city,
          addressRegion: site.mailingAddress.state,
          postalCode: site.mailingAddress.postalCode,
          addressCountry:
            site.mailingAddress.countryCode ?? site.mailingAddress.country,
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            email: site.publicContactEmail,
            contactType: "public inquiries",
            url: site.publicContactUrl,
          },
        ],
        sameAs: site.sameAs,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: site.canonicalOrigin,
        name: site.name,
        alternateName: site.alternateSiteNames,
        description: site.description,
        publisher: { "@id": organizationId },
      },
    ],
  };
}
