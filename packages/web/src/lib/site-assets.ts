import type { Metadata, MetadataRoute } from "next";
import type { SiteConfig, SiteKey } from "@/lib/site";
import { AI_CRAWLER_USER_AGENTS } from "@/lib/agent-readable/ai-crawler-detection";
import { ROUTES } from "@/lib/routes";

export function getSiteManifestPath(site: SiteConfig) {
  return `/manifest.webmanifest?site=${site.key}`;
}

export function getSiteIconPath(site: SiteConfig, size: 16 | 32 | 180) {
  if (size === 16) return site.assets.icon16 ?? site.assets.icon32;
  if (size === 180) return site.assets.appleTouchIcon;
  return site.assets.icon32;
}

export function getManifestIconPath(site: SiteConfig, size: 192 | 512) {
  return size === 192 ? site.assets.icon192 : site.assets.icon512;
}

export function getSiteIcons(site: SiteConfig): Metadata["icons"] {
  return {
    icon: [
      { url: site.assets.favicon, sizes: "any" },
      ...(site.assets.icon16
        ? [{ url: site.assets.icon16, sizes: "16x16", type: "image/png" }]
        : []),
      { url: site.assets.icon32, sizes: "32x32", type: "image/png" },
      { url: site.assets.icon192, sizes: "192x192", type: "image/png" },
      { url: site.assets.icon512, sizes: "512x512", type: "image/png" },
    ],
    apple: site.assets.appleTouchIcon,
    shortcut: site.assets.favicon,
    other: site.assets.maskableIcon
      ? [
          {
            rel: "icon",
            url: site.assets.maskableIcon,
            sizes: "512x512",
            type: "image/png",
          },
        ]
      : undefined,
  };
}

export function getSiteSocialImage(site: SiteConfig) {
  return site.rootMetadata.openGraphImage;
}

export function getSiteTwitterImage(site: SiteConfig) {
  return site.rootMetadata.twitterImage;
}

export function getSiteManifest(site: SiteConfig): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: site.rootMetadata.description,
    start_url: "/",
    display: "standalone",
    background_color: site.assets.backgroundColor,
    theme_color: site.assets.themeColor,
    icons: [
      ...(site.assets.icon16
        ? [
            {
              src: site.assets.icon16,
              sizes: "16x16",
              type: "image/png",
            },
          ]
        : []),
      {
        src: site.assets.icon32,
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: site.assets.icon192,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: site.assets.icon512,
        sizes: "512x512",
        type: "image/png",
      },
      ...(site.assets.maskableIcon
        ? [
            {
              src: site.assets.maskableIcon,
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable" as const,
            },
          ]
        : []),
    ],
  };
}

export function getSiteRobots(site: SiteConfig): MetadataRoute.Robots {
  const privateDisallows = [
    "/api",
    "/admin",
    "/auth",
    ROUTES.dashboard,
    ROUTES.profile,
    ROUTES.settings,
    "/_next",
  ];
  const publicAllows = ["/", "/api/agent/"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: publicAllows,
        disallow: privateDisallows,
      },
      ...AI_CRAWLER_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: publicAllows,
        disallow: privateDisallows,
      })),
    ],
    sitemap: [`${site.canonicalOrigin}/sitemap.xml`],
    host: site.canonicalOrigin,
  };
}

export function getSiteStaticAssetRedirectPath(
  site: SiteConfig,
  pathname: string,
) {
  const redirectPath =
    {
      "/apple-touch-icon.png": site.assets.appleTouchIcon,
      "/favicon.ico": site.assets.favicon,
      "/manifest.json": getSiteManifestPath(site),
      "/og-image.jpg": site.rootMetadata.openGraphImage.url,
      "/twitter-image.jpg": site.rootMetadata.twitterImage,
    }[pathname] ?? null;

  return redirectPath && redirectPath !== pathname ? redirectPath : null;
}

export function getSiteKeyFromSearchParam(
  value: string | null,
  fallback: SiteKey,
  isSiteKey: (candidate: string | null | undefined) => candidate is SiteKey,
) {
  return isSiteKey(value) ? value : fallback;
}
