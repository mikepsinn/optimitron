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
      // Pages that belong to other campaign sites. site-kit's middleware sent them there before this app
      // left site-kit, and old links to acceleratedmedicine.org may still use them.
      { source: "/docs/:path*", destination: "https://wiki.dfda.earth/:path*/", permanent: true },
      { source: "/institutes", destination: "https://warondisease.org/institutes", permanent: false },
      { source: "/institutes/:path*", destination: "https://warondisease.org/institutes/:path*", permanent: false },
      { source: "/u", destination: "https://warondisease.org/u", permanent: false },
      { source: "/u/:path*", destination: "https://warondisease.org/u/:path*", permanent: false },
      { source: "/conditions", destination: "https://dfda.earth/conditions", permanent: false },
      { source: "/conditions/:path*", destination: "https://dfda.earth/conditions/:path*", permanent: false },
      { source: "/treatments", destination: "https://dfda.earth/treatments", permanent: false },
      { source: "/treatments/:path*", destination: "https://dfda.earth/treatments/:path*", permanent: false },
      { source: "/wishocracy", destination: "https://wishocracy.org/wishocracy", permanent: false },
      { source: "/wishocracy/:path*", destination: "https://wishocracy.org/wishocracy/:path*", permanent: false },
      { source: "/developers", destination: "https://warondisease.org/developers", permanent: false },
      { source: "/divisions", destination: "https://warondisease.org/divisions", permanent: false },
      { source: "/door-to-door", destination: "https://warondisease.org/door-to-door", permanent: false },
      { source: "/employees", destination: "https://warondisease.org/employees", permanent: false },
      { source: "/feedback", destination: "https://warondisease.org/feedback", permanent: false },
      { source: "/join", destination: "https://warondisease.org/join", permanent: false },
      { source: "/joke", destination: "https://warondisease.org/joke", permanent: false },
      { source: "/mcp", destination: "https://warondisease.org/mcp", permanent: false },
      { source: "/missions", destination: "https://warondisease.org/missions", permanent: false },
      { source: "/poster", destination: "https://warondisease.org/poster", permanent: false },
      { source: "/references", destination: "https://warondisease.org/references", permanent: false },
      { source: "/research", destination: "https://warondisease.org/research", permanent: false },
      { source: "/search", destination: "https://warondisease.org/search", permanent: false },
      { source: "/shirt", destination: "https://warondisease.org/shirt", permanent: false },
      { source: "/signatories", destination: "https://warondisease.org/signatories", permanent: false },
      { source: "/soldiers", destination: "https://warondisease.org/soldiers", permanent: false },
      { source: "/treaty", destination: "https://warondisease.org/treaty", permanent: false },
      { source: "/court", destination: "https://courtofhumanity.org/court", permanent: false },
      { source: "/developers/tools", destination: "https://courtofhumanity.org/developers/tools", permanent: false },
      { source: "/humanity-v-government", destination: "https://courtofhumanity.org/humanity-v-government", permanent: false },
      { source: "/plaintiffs", destination: "https://courtofhumanity.org/plaintiffs", permanent: false },
      { source: "/find-trials", destination: "https://dfda.earth/find-trials", permanent: false },
      { source: "/results", destination: "https://trialabundancesurvey.org/results", permanent: false },
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
