import path from "node:path"
import { fileURLToPath } from "node:url"
import { withSentryConfig } from "@sentry/nextjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(__dirname, "../..")

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@optimitron/neobrutalist-ui", "@optimitron/impact-params", "@optimitron/survey-embed", "@optimitron/site-kit"],
  outputFileTracingRoot: monorepoRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        source: "/embed.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: "/campaigns", destination: "/", permanent: false },
      { source: "/campaigns/:path*", destination: "/", permanent: false },
      { source: "/auth/signup", destination: "/auth/signin", permanent: false },
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
  disableLogger: true,
  automaticVercelMonitors: true,
})

