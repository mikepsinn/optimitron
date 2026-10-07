import path from "node:path"
import { fileURLToPath } from "node:url"
import { withSentryConfig } from "@sentry/nextjs"
import { pinAppNextAuthInstance } from "../shared-next-config.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(__dirname, "../..")

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@optimitron/neobrutalist-ui", "@optimitron/data"],
  outputFileTracingRoot: monorepoRoot,
  // The presentation reads its script at request time (lib/present-script.ts).
  outputFileTracingIncludes: {
    "/present/patient-journey": ["./content/patient-journey/script.md"],
  },
  webpack(config) {
    return pinAppNextAuthInstance(config, __dirname)
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/campaigns", destination: "/", permanent: false },
      { source: "/campaigns/:path*", destination: "/", permanent: false },
      // Retired when the site refocused on the act (October 2026). Sign-up lives on /support, which
      // needs no account.
      { source: "/right-to-trial", destination: "/act", permanent: true },
      // Montana has its own page, not a generated state page.
      { source: "/states/montana", destination: "/montana", permanent: true },
      { source: "/survey", destination: "/support", permanent: false },
      { source: "/survey/:path*", destination: "/support", permanent: false },
      { source: "/dashboard", destination: "/support", permanent: false },
      { source: "/auth/:path*", destination: "/", permanent: false },
      { source: "/the-plan", destination: "https://warondisease.org/the-plan", permanent: false },
      // The model framework differed from the act; /act describes it until the bill text is published.
      { source: "/model-act", destination: "/act", permanent: false },
      {
        source: "/knowledge/:path*",
        destination: "https://manual.warondisease.org/knowledge/:path*",
        permanent: true,
      },
      { source: "/join-us", destination: "/", permanent: false },
      {
        source: "/stupid-questions",
        destination:
          "https://docs.google.com/document/d/1zQpLG2bFeYLGN-9K-VwJewdw0vG_MwpuLP6Lq81W4_0/edit",
        permanent: false,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: "wishonia-org",
  project: "dih",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
