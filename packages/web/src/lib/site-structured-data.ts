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
        url: site.organizationUrl,
        logo: absoluteUrl(site.organizationUrl, site.organizationLogoPath),
        description: site.description,
        email: site.publicContactEmail,
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
