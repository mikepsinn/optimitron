import type { Metadata } from "next"

/**
 * acceleratedmedicine.org's own settings: metadata, header, footer, legal pages and emails read them here.
 * They started as a copy of the acceleratedmedicine.org entry in packages/site-kit/src/lib/site-config.ts,
 * which this app no longer reads.
 */
export const SITE = {
  title: "Care-Integrated Clinical Trials Initiative",
  description:
    "Every patient should be able to join clinical trials of the most promising treatments, through their own doctor, with every result published.",
  url: "https://acceleratedmedicine.org",
  /** The site's name in legal text, such as "By using AcceleratedMedicine.org". */
  websiteLabel: "AcceleratedMedicine.org",
  /** The inbox for questions, form alerts and donor receipts. */
  email: "hello@acceleratedmedicine.org",
  /** Major gifts and foundation grants (the /donate page). */
  donationsEmail: "donations@acceleratedmedicine.org",
  /** Runs the initiative and operates the website. Terms and Privacy name it. */
  legalEntityName: "Institute for Accelerated Medicine",
  /** The "from" name on emails the site sends. */
  emailFromName: "Institute for Accelerated Medicine",
  openGraphImage: {
    path: "/assets/acceleratedmedicine/iam-og-1200x630.png",
    width: 1200,
    height: 630,
    alt: "The Care-Integrated Clinical Trials Initiative: see your doctor, compare rankings, check the outcome label, and every clinic adds results.",
  },
  icons: {
    icon: [
      { url: "/assets/acceleratedmedicine/favicon.ico", sizes: "any" },
      { url: "/assets/acceleratedmedicine/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/acceleratedmedicine/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/acceleratedmedicine/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/assets/acceleratedmedicine/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    other: [
      { rel: "icon", url: "/assets/acceleratedmedicine/iam-icon-master.png", sizes: "1024x1024", type: "image/png" },
    ],
  } satisfies Metadata["icons"],
}

/** The share image's absolute address, for pages that set their own Open Graph and Twitter blocks. */
export const OPEN_GRAPH_IMAGE_URL = `${SITE.url}${SITE.openGraphImage.path}`
